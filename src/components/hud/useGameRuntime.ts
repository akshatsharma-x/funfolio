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
import { applyToDocument, type Effective } from "@/lib/apply";
import { bus } from "@/lib/bus";
import { setCommandHandler, type Command } from "@/lib/commands";
import { locateCursor, setCursorSkin } from "@/lib/cursor";
import { readUrlOverrides, type Theme, type UrlOverrides } from "@/lib/prefs";
import { getLenis, scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { useSave, type Settings } from "@/lib/store";
import { sweepTheme } from "@/lib/theme";
import { isPauseTab, useUi } from "@/lib/ui";
import { fx } from "@/lib/juice";
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
    const sections = [...document.querySelectorAll<HTMLElement>("main section[data-world]")];
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
    const unsub = useSave.subscribe((s, prev) => {
      if (s.settings !== prev.settings || s.inventory.equipped !== prev.inventory.equipped) apply();
    });
    const os = window.matchMedia("(prefers-reduced-motion: reduce)");
    os.addEventListener("change", apply);
    return () => {
      unsub();
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
          bus.emit("item:acquired", { title: c.title, detail: c.detail });
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
        // Never steal Esc from a field; open dialogs close themselves (native <dialog> cancel).
        if (typing || dialogOpen) return;
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
        } else return;
        e.preventDefault();
        return;
      }
      if (k >= "0" && k <= "8") jumpToWorld(Number(k));
      else if (k === "m" || k === "M") useUi.getState().openPause("map");
      else if (k === "l" || k === "L") locateCursor();
      else if (k === "`") bus.emit("terminal:toggle", {});
      else return; // every other single letter is reserved for typed easter-egg words (PART 16)
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
      bus.on("coin:collected", () => sfx.play("coin")),
      bus.on("level:up", () => sfx.play("levelUp")),
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
