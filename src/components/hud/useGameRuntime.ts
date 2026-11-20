"use client";

// Game runtime systems (PART 3). Mounted once by <GameRuntime/> (lazy, client-only).
//   useDocumentSync      save → <html> attributes, cursor assets, sound (+ URL overrides, OS motion changes)
//   useCommandHandler    commands from server-rendered islands → store actions
//   useKeyboardShortcuts the ONE place shortcuts live (0–8 · Esc · M · L · Shift+S/D/R · ` · ?)
//   useWorldTracker      IntersectionObserver per world → current world, --world, visit XP, achievements
//   useStatsTracker      clicks + time played (batched writes)
//   useBusWiring         sounds for unlocks/coins/level-ups, cursor shake → "shaky-hands"

import { useEffect } from "react";
import { WORLDS, type WorldId } from "@/content/worlds";
import { XP_RULES } from "@/content/levels";
import { GAME_BY_ID } from "@/content/games";
import { applyToDocument, type Effective } from "@/lib/apply";
import { bus } from "@/lib/bus";
import { setCommandHandler, type Command } from "@/lib/commands";
import { locateCursor, setCursorSkin } from "@/lib/cursor";
import { readUrlOverrides, type Theme, type UrlOverrides } from "@/lib/prefs";
import { getLenis, scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { useSave, type Settings } from "@/lib/store";
import { sweepTheme } from "@/lib/theme";
import { haptic } from "@/lib/haptics";
import { isPauseTab, useUi } from "@/lib/ui";
import { fx } from "@/lib/juice";
import { byte } from "@/lib/byte";
import { warp } from "@/lib/warp";

const TEXT_FIELDS =
  'input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="file"],[type="image"]), textarea, select, [contenteditable]:not([contenteditable="false"])';

/** Session state shared by the runtime hooks. */
const runtime: { overrides: UrlOverrides; effective: Effective | null; sessionStarted: boolean } = {
  overrides: {},
  effective: null,
  sessionStarted: false,
};

function apply() {
  runtime.effective = applyToDocument(useSave.getState(), runtime.overrides);
  if (runtime.effective.mode === "speedrun") useSave.getState().unlock("speedrunner");
}

export function effectiveTheme(): Theme {
  return runtime.effective?.theme ?? useSave.getState().settings.theme;
}

export function isSpeedrun(): boolean {
  return (runtime.effective?.mode ?? useSave.getState().settings.mode) === "speedrun";
}

/** Speedrun on/off. Turning it off also drops a ?speedrun URL override (the recruiter link). */
export function setSpeedrun(on: boolean | "toggle") {
  const next = on === "toggle" ? !isSpeedrun() : on;
  if (!next && runtime.overrides.speedrun) {
    runtime.overrides = { ...runtime.overrides, speedrun: undefined };
    const url = new URL(window.location.href);
    url.searchParams.delete("speedrun");
    if (url.searchParams.get("mode") === "speedrun") url.searchParams.delete("mode");
    history.replaceState(history.state, "", url);
  }
  useSave.getState().setSetting("mode", next ? "speedrun" : "play");
  apply();
  // Back to the top (the summary / the title). force: also while Lenis is stopped by an open pause menu.
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0 });
}

/** Day/night toggle (or a specific theme) with the circular sweep from `origin`. */
export function switchTheme(value: Theme | "toggle", origin?: { x: number; y: number }) {
  const next: Theme = value === "toggle" ? (effectiveTheme() === "day" ? "night" : "day") : value;
  const store = useSave.getState();
  if (next === "retro" && !store.inventory.owned.includes("theme-retro")) {
    bus.emit("item:acquired", { title: "Retro CRT is locked", detail: "Reach LV 7 or visit the Prize Counter.", icon: "lock" });
    sfx.play("error");
    return;
  }
  runtime.overrides = { ...runtime.overrides, theme: undefined }; // an explicit choice beats ?theme=
  sweepTheme(() => {
    store.setSetting("theme", next);
    apply();
  }, origin);
}

/** World number (0–8) → its section, respecting Speedrun Mode (World 2 → Quest Log, gates skipped). */
export function jumpToWorld(n: number) {
  const speedrun = isSpeedrun();
  const target = WORLDS.find((w) => w.number === n && (n !== 2 || w.sub === (speedrun ? "B" : "A")));
  const el = target ? document.getElementById(target.id) : null;
  if (!el || el.getClientRects().length === 0) return;
  warp();
  scrollToElement(el, { focus: true });
}

/**
 * Idle nap (PART 6 · docs/DECISIONS.md #67): after 30s without input, html[data-idle] pauses every decorative CSS loop
 * (they all run on --play), so a page left open stops costing main-thread time; any input resumes them at once.
 */
const IDLE_NAP_MS = 30_000;
/**
 * PART 18 · juice audit: every click answers with a sound too (when sound is on — it's off by default, R5). A control
 * that played nothing of its own within 150ms (a landmark, a perk, a tab, Pause the roll…) gets a soft blip; one that
 * did is left alone. Keyboard activation (Enter / Space) fires the same click. Fields, BYTE and game screens have
 * their own voices.
 */
export function useClickSound() {
  useEffect(() => {
    const CONTROL = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="switch"], summary, label';
    const QUIET = 'input:not([type="radio"]):not([type="checkbox"]), textarea, select, [data-byte], [data-keyboard="exclusive"], [data-game-screen], [data-sfx-skip]';
    const onClick = (e: MouseEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t?.closest(CONTROL) || t.closest(QUIET)) return;
      // heard in the capture phase (some handlers stop the click — the Skill Tree's links), decided in a task after
      // every handler has run and asked for its own sound
      window.setTimeout(() => {
        if (!sfx.askedWithin(150)) sfx.play("click", { volume: 0.6 });
      }, 0);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);
}

export function useIdleNap() {
  useEffect(() => {
    const root = document.documentElement;
    let last = performance.now();
    let timer = 0;
    const check = () => {
      const quiet = performance.now() - last;
      if (quiet >= IDLE_NAP_MS) root.setAttribute("data-idle", "");
      else timer = window.setTimeout(check, IDLE_NAP_MS - quiet + 50);
    };
    const onInput = () => {
      last = performance.now();
      if (root.hasAttribute("data-idle")) {
        root.removeAttribute("data-idle");
        window.clearTimeout(timer);
        timer = window.setTimeout(check, IDLE_NAP_MS);
      }
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((t) => window.addEventListener(t, onInput, { passive: true }));
    timer = window.setTimeout(check, IDLE_NAP_MS);
    return () => {
      window.clearTimeout(timer);
      events.forEach((t) => window.removeEventListener(t, onInput));
      root.removeAttribute("data-idle");
    };
  }, []);
}

/**
 * Off-screen worlds rest (PART 6): a world section that isn't on screen gets [data-offscreen], which pauses its
 * decorative loops (--play) — eleven of them live in the Profile alone, and Chrome ticks even unseen ones.
 */
export function useOffscreenPause() {
  useEffect(() => {
    // the worlds, and the credits footer (its roll is a loop too — PART 15)
    const sections = [...document.querySelectorAll<HTMLElement>("main section[data-world], footer[data-world]")];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.target as HTMLElement).toggleAttribute("data-offscreen", !e.isIntersecting)),
      { rootMargin: "64px 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      sections.forEach((s) => s.removeAttribute("data-offscreen"));
    };
  }, []);
}

export function useDocumentSync() {
  useEffect(() => {
    runtime.overrides = readUrlOverrides();
    if (!runtime.sessionStarted) {
      runtime.sessionStarted = true; // StrictMode runs effects twice in dev — start the session once
      useUi.getState().setPreviousVisit(useSave.getState().startSession());
    }
    apply();
    // the Quest Log's soft gate (PART 7): open at load when the save, Speedrun Mode or reduced motion says so (a gate
    // opened during the visit is revealed by QuestGate); never re-locked here — only after a save reset
    const root = document.documentElement;
    const syncGate = () => {
      const s = useSave.getState();
      const reduced = s.settings.reducedMotion === "reduce" || (s.settings.reducedMotion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (s.gates.includes("quest-log") || root.getAttribute("data-mode") === "speedrun" || reduced) root.setAttribute("data-quest-log", "open");
    };
    syncGate();
    const offReset = bus.on("save:reset", () => {
      root.setAttribute("data-quest-log", "locked");
      syncGate();
    });
    const unsub = useSave.subscribe((s, prev) => {
      if (s.settings !== prev.settings || s.inventory.equipped !== prev.inventory.equipped) apply();
      if (s.settings !== prev.settings) syncGate();
    });
    const os = window.matchMedia("(prefers-reduced-motion: reduce)");
    os.addEventListener("change", apply);
    return () => {
      unsub();
      offReset();
      os.removeEventListener("change", apply);
    };
  }, []);
}

export function useCommandHandler(resumeHref: string | null) {
  useEffect(() => {
    const handle = (c: Command) => {
      const store = useSave.getState();
      switch (c.type) {
        case "cta":
          store.addXp(XP_RULES.cta, `cta:${c.id}`, c.origin);
          break;
        case "achievement":
          store.unlock(c.id);
          break;
        case "xp":
          store.addXp(c.amount, c.reason, c.origin);
          break;
        case "coin":
          store.collectCoin(c.id, c.origin);
          break;
        case "spare-coin":
          if (store.collectSpare(c.id, c.origin) && c.origin) fx.burst(c.origin.x, c.origin.y, { shape: "coin", count: 8 });
          break;
        case "download":
          if (c.what === "resume" && resumeHref) {
            store.unlock("save-file");
            bus.emit("item:acquired", { title: "Save file downloaded", detail: decodeURIComponent(resumeHref.split("/").pop() ?? "résumé"), icon: "chest" });
          }
          break;
        case "speedrun":
          setSpeedrun(c.on);
          break;
        case "theme":
          switchTheme(c.value, c.origin);
          break;
        case "setting":
          store.setSetting(c.key as keyof Settings, c.value as never);
          break;
        case "pause":
          useUi.getState().openPause(isPauseTab(c.tab) ? c.tab : undefined);
          break;
        case "preview-cursor-skin":
          setCursorSkin(c.id); // playground preview only — not saved
          break;
        case "item":
          bus.emit("item:acquired", { title: c.title, detail: c.detail, kicker: c.kicker });
          break;
        case "egg":
          bus.emit("egg:trigger", { id: c.id });
          break;
        case "openGame": {
          // PART 13: the JD Scanner is a Skill Tree tool, not a cabinet — its side quest opens the scanner tab
          if (c.id === "jd-scanner" && document.getElementById("skills-jd")) {
            bus.emit("skills:open", { tab: "jd" });
            break;
          }
          // PART 11: ready games open in the game host (full-screen modal); the rest are still "coming soon"
          const game = GAME_BY_ID[c.id];
          if (game?.ready) {
            useUi.getState().openGame(c.id);
            break;
          }
          sfx.play("error");
          bus.emit("item:acquired", { kicker: "Side quest", title: "Cartridge not found", detail: `${game?.name ?? "This game"} — coming soon`, icon: "cartridge" });
          break;
        }
        case "scroll": {
          store.addXp(XP_RULES.openDetails, `open:scroll-${c.id}`);
          const claims = useSave.getState().player.xpClaims;
          if (c.all.length > 0 && c.all.every((id) => claims.includes(`open:scroll-${id}`))) store.unlock("bookworm");
          break;
        }
        case "cartridge": {
          store.addXp(XP_RULES.openDetails, `open:cartridge-${c.id}`);
          const claims = useSave.getState().player.xpClaims;
          if (c.all.length > 0 && c.all.every((id) => claims.includes(`open:cartridge-${id}`))) store.unlock("cartridge-collector");
          break;
        }
        case "visitor-name":
          store.setVisitorName(c.name);
          break;
        case "gate":
          if (c.how === "skipped") store.unlock("skipper");
          // the gate's own island (QuestGate) stages the reveal: chains shatter, then the cards deal in
          if (store.openGate(c.id)) {
            bus.emit("gate:open", { id: c.id, how: c.how });
            if (c.how === "scrolled" || c.how === "focus") byte.say("Fine, fine… unlocked for you 🙄", { mood: "cool", now: true });
          }
          break;
      }
    };
    return setCommandHandler(handle);
  }, [resumeHref]);
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const active = document.activeElement;
      const typing = !!active && (active.matches(TEXT_FIELDS) || (active as HTMLElement).isContentEditable);
      const dialogOpen = !!document.querySelector("dialog[open]");
      const exclusive = !!active?.closest('[data-keyboard="exclusive"]');

      if (e.key === "Escape") {
        // Never steal Esc from a field; open dialogs close themselves (native <dialog> cancel). The handheld pad's B
        // sends a synthetic Escape to close cards and menus — it must never open the pause menu (that's START).
        if (typing || dialogOpen || (e as KeyboardEvent & { padB?: boolean }).padB) return;
        e.preventDefault();
        useUi.getState().openPause();
        return;
      }
      // While typing, inside a modal or a focused game, only Esc is global.
      if (typing || dialogOpen || exclusive || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

      const store = useSave.getState();
      const k = e.key;
      if (k === "?") {
        e.preventDefault();
        useUi.getState().openPause("controls");
        return;
      }
      if (e.shiftKey) {
        if (k === "S" || k === "s") {
          store.setSetting("sound", !store.settings.sound);
          if (!store.settings.sound) sfx.play("powerUp");
        } else if (k === "D" || k === "d") {
          const btn = document.querySelector<HTMLElement>("[data-hud-theme]");
          const r = btn?.getBoundingClientRect();
          switchTheme("toggle", r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
        } else if (k === "R" || k === "r") {
          setSpeedrun("toggle");
        } else if (k === "F10") {
          bus.emit("menu:open", {}); // the game menu at the focused element (PART 16) — a context-menu key's twin
        } else return;
        e.preventDefault();
        return;
      }
      if (k >= "0" && k <= "8") jumpToWorld(Number(k));
      else if (k === "m" || k === "M") useUi.getState().openPause("map");
      else if (k === "l" || k === "L") locateCursor();
      else if (k === "`") bus.emit("terminal:toggle", {});
      else {
        // every other key goes to the eggs (typed words, the cheat code) — observed, never swallowed: arrows still
        // scroll, letters still do whatever the page does with them (PART 16)
        if (k.length === 1 || k.startsWith("Arrow")) bus.emit("egg:key", { key: k });
        return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** `routeKey` (the pathname) re-runs the scan after a client-side navigation. */
export function useWorldTracker(routeKey: string) {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section[data-world][id], body > footer[data-world][id]"));
    // no worlds here (the 404, the playground): the HUD names the page instead of "World 0"
    useUi.getState().setPageLabel(sections.length ? null : (document.querySelector<HTMLElement>("main[data-hud-label]")?.dataset.hudLabel ?? null));
    if (sections.length === 0) return;
    const ids = new Set(WORLDS.map((w) => w.id));
    let current: WorldId | null = null; // local, so the world in view at load is "entered" (and visited) too
    const enter = (id: WorldId) => {
      if (current === id) return;
      current = id;
      useUi.getState().setCurrentWorld(id);
      document.documentElement.setAttribute("data-world", id);
      bus.emit("world:enter", { id });
      useSave.getState().visitWorld(id);
    };
    // A thin band across the middle of the viewport: whichever world crosses it is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-world");
          if (entry.isIntersecting && id && ids.has(id as WorldId)) enter(id as WorldId);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [routeKey]);
}

export function useStatsTracker() {
  useEffect(() => {
    let clicks = 0;
    let since = document.hidden ? 0 : performance.now();
    const flush = () => {
      const now = performance.now();
      const played = since ? now - since : 0;
      since = document.hidden ? 0 : now;
      useSave.getState().addStats(clicks, played);
      clicks = 0;
    };
    const onDown = () => {
      clicks += 1;
    };
    const timer = window.setInterval(flush, 15000);
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}

/** Spare coins already pocketed (sticker peels) and hidden coins already found — server markup can't know the save. */
export function useSpareCoinSync(routeKey: string) {
  useEffect(() => {
    const sync = (claims: string[], coins: string[]) => {
      document.querySelectorAll<HTMLElement>("[data-spare-coin]").forEach((el) => {
        el.toggleAttribute("data-pocketed", claims.includes(`spare:${el.dataset.spareCoin}`));
      });
      // PART 5: hidden coins already found (the K, behind the Quest Tower…) never show up again
      document.querySelectorAll<HTMLElement>("[data-coin-id]").forEach((el) => {
        el.toggleAttribute("data-collected", coins.includes(el.dataset.coinId ?? ""));
      });
    };
    sync(useSave.getState().player.xpClaims, useSave.getState().player.coinIds);
    return useSave.subscribe((s, prev) => {
      if (s.player.xpClaims !== prev.player.xpClaims || s.player.coinIds !== prev.player.coinIds) sync(s.player.xpClaims, s.player.coinIds);
    });
  }, [routeKey]);
}

export function useBusWiring() {
  useEffect(() => {
    const offs = [
      bus.on("cursor:shake", () => useSave.getState().unlock("shaky-hands")),
      bus.on("achievement:unlocked", () => sfx.play("achievement")),
      bus.on("coin:collected", () => {
        sfx.play("coin");
        haptic(20); // PART 17 · handheld haptics
      }),
      bus.on("level:up", () => {
        sfx.play("levelUp");
        haptic(20);
      }),
      bus.on("achievement:unlocked", () => haptic(15)),
      bus.on("xp:gained", ({ reason }) => {
        if (!reason.startsWith("achievement:") && !reason.startsWith("coin:")) sfx.play("xp");
      }),
      bus.on("item:acquired", () => sfx.play("pop")),
      bus.on("shop:bought", () => sfx.play("insertCoin")),
      bus.on("shop:denied", () => sfx.play("error")),
    ];
    return () => offs.forEach((off) => off());
  }, []);
}
