"use client";

import { useEffect, useRef, useState } from "react";
import type { EggData } from "@/content/eggs";
import { LATEST_PATCH } from "@/content/patchNotes";
import { announce } from "@/lib/announce";
import { bus } from "@/lib/bus";
import { byte } from "@/lib/byte";
import { command } from "@/lib/commands";
import { CHEAT_CODE, CORNERS, EGG_BY_ID, EGG_TIMING, TYPED_WORDS, fxAllows, isNightOwlHour, type Corner, type EggId } from "@/lib/eggs";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { switchTheme } from "@/components/hud/useGameRuntime";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { ContextMenu, type MenuAt } from "./ContextMenu";
import { printBanner } from "./devtools";

type Effects = typeof import("./effects");
let effectsP: Promise<Effects> | null = null;
const effects = () => (effectsP ??= import("./effects"));

type Chest = { key: number; x: number; y: number; fact: string };
const TAB_TITLE = "👾 Come back, Player 1!";

/**
 * Secrets & surprises (PART 16): one provider, every listener attached once — the four corners, typed words and the
 * cheat code (fed by the keyboard manager over the bus), the selection, idle, the night owl, the proctor, DevTools,
 * loot chests, milestones, the patch-notes toast, hidden-coin ceremonies and the right-click menu. Each egg checks
 * Speedrun Mode (only the terminal and the menu stay on), `data-fx` (its `minFx`) and reduced motion (static
 * versions), and records its first find in the save (stats.eggsFound). Effects are a lazy chunk; nothing here
 * blocks content, links, selection or forms (passive listeners; the menu leaves links, fields, media, dialogs and
 * selections to the browser).
 */
export default function EggProvider({ data, resumeHref }: { data: EggData; resumeHref: string | null }) {
  const [menu, setMenu] = useState<MenuAt | null>(null);
  const [chest, setChest] = useState<Chest | null>(null);
  const [gear, setGear] = useState(false);
  const [bored, setBored] = useState(false);
  const [proctor, setProctor] = useState(false);
  const [patch, setPatch] = useState(false);
  const chestsShown = useRef(0);

  useEffect(() => {
    const html = document.documentElement;
    const abort = new AbortController();
    const on = { signal: abort.signal, passive: true } as const;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };
    // opt-in test hooks (like __QA_CAPSULE): force the chest's odds, shorten the idle timings
    const qa = (window as unknown as { __QA_EGGS?: { chestOdds?: number; sleepAfterMs?: number; boredAfterMs?: number } }).__QA_EGGS;
    const SLEEP = qa?.sleepAfterMs ?? EGG_TIMING.sleepAfterMs;
    const BORED = qa?.boredAfterMs ?? EGG_TIMING.boredAfterMs;

    const speedrun = () => html.getAttribute("data-mode") === "speedrun";
    const reduced = () => prefersReducedMotion();
    const fxOk = (id: EggId) => fxAllows(html.getAttribute("data-fx"), EGG_BY_ID[id].minFx);
    /** A dialog, a game or the boot screen is up: ambient eggs wait. */
    const busy = () => !!document.querySelector("dialog[open]") || html.hasAttribute("data-game-open") || html.hasAttribute("data-boot");
    const byteShown = () => !!document.querySelector("[data-byte]");
    let pointer: { x: number; y: number } | null = null;

    // ── finds ─────────────────────────────────────────────────────────────────────────────────────────────────────
    const found = (id: EggId) => {
      const s = useSave.getState();
      if (s.findEgg(id)) bus.emit("egg:found", { id });
      const ach = EGG_BY_ID[id]?.achievement;
      if (id.startsWith("corner-")) {
        if (CORNERS.every((c) => useSave.getState().stats.eggsFound.includes(`corner-${c}`))) s.unlock("corner-case");
      } else if (ach && ach !== "explorer") s.unlock(ach);
    };

    const toLobby = () => {
      const lobby = document.getElementById("lobby");
      if (lobby) scrollToElement(lobby, { focus: true });
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load: the home page's pre-paint script has to run
      else location.assign("/#lobby");
    };

    // ── the dispatcher ──────────────────────────────────────────────────────────────────────────────────────────
    const play = async (id: EggId, how: "found" | "trigger") => {
      const egg = EGG_BY_ID[id];
      if (!egg) return;
      if (speedrun() && !egg.speedrun) return; // Speedrun Mode: only the terminal and the menu
      const juice = !reduced() && (how === "trigger" || fxOk(id));
      found(id);
      // the motion-heavy ones say they were found even when they can't play (reduced motion, CHILL)
      const quiet = () =>
        command({ type: "item", kicker: "Egg found", title: egg.name, detail: reduced() ? "This one is all motion — it rests while reduced motion is on" : "It plays with effects on Normal or Chaos (Pause → Settings)" });
      switch (id) {
        case "corner-top-left":
          return (await effects()).flipLogo(reduced());
        case "corner-top-right":
          sfx.play("clink", { pitch: 0.8 });
          setGear(true);
          announce("A secret gear appeared in the top-right corner.");
          later(() => setGear(false), 6000);
          return;
        case "corner-bottom-left":
          announce("A pixel door creaked open on the dev room.");
          return (await effects()).devRoom(reduced());
        case "corner-bottom-right":
          if (byteShown()) byte.peek();
          announce("BYTE peeks in and waves.");
          return;
        case "cheat-code": {
          const s = useSave.getState();
          s.unlock("cheat-code"); // grants the Retro CRT theme (prizes.ts ACHIEVEMENT_GRANTS)
          switchTheme("retro");
          useUi.getState().setByteLook({ shades: true });
          announce("Cheat activated: Retro CRT theme on, BYTE in pixel shades.");
          return (await effects()).cheatBanner(juice && html.getAttribute("data-fx") !== "chill", reduced());
        }
        case "word-akshat": {
          // the Title's K pays out from the keyboard too (coin #3 · DECISIONS #59 promised a keyboard path)
          const name = document.querySelector("#title h1");
          const r = name?.getBoundingClientRect();
          if (r && r.bottom > 64 && r.top < innerHeight && name?.getClientRects().length) command({ type: "coin", id: "title-k", origin: { x: r.left + r.width * 0.25, y: r.top + r.height / 2 } });
          if (juice) await (await effects()).letterRain();
          else quiet();
          return;
        }
        case "word-hire":
          if (juice) fx.confetti();
          sfx.play("win");
          byte.say("Excellent choice.", { mood: "love", now: true });
          toLobby();
          return;
        case "word-bug":
          if (!juice) return quiet();
          return (await effects()).bugs((x, y) => {
            sfx.play("pop");
            fx.burst(x, y, { shape: "spark", count: 10 });
            fx.text(x, y - 18, "SQUASHED!", { color: "#B6FF3B", size: 16 });
          });
        case "word-coffee":
          if (!juice) return quiet();
          sfx.play("blip", { pitch: 0.7 });
          return (await effects()).coffeeSteam(EGG_TIMING.steamMs, pointer);
        case "word-sudo":
        case "terminal":
          useUi.getState().setTerminal(true);
          return;
        case "devtools":
          printBanner(true);
          command({ type: "item", kicker: "Psst", title: "The console says hi", detail: "Open DevTools (F12) — try akshat.help()" });
          return;
        case "proctor":
          setProctor(true);
          sfx.play("error", { pitch: 1.3 });
          later(() => setProctor(false), 6000);
          return;
        case "idle-sleep":
          fx.gridChase();
          if (how === "trigger") byte.react("sleepy");
          return;
        case "idle-bored":
          setBored(true);
          return;
        case "night-owl":
          useUi.getState().setByteLook({ nightcap: true });
          return;
        case "context-menu":
          setMenu({ x: innerWidth / 2, y: innerHeight / 2, returnTo: document.activeElement instanceof HTMLElement ? document.activeElement : null });
          return;
        case "select-byte":
          byte.blush();
          return;
        case "loot-chest":
          return showChest();
        case "milestone-clicks":
        case "milestone-time":
        case "milestone-worlds": {
          (await effects()).fanfare(reduced());
          const title = id === "milestone-clicks" ? `${EGG_TIMING.milestoneClicks} clicks` : id === "milestone-time" ? "5 minutes played" : "Every world visited";
          if (id !== "milestone-worlds") command({ type: "item", kicker: "Milestone", title, detail: "Thanks for playing — keep going" });
          return;
        }
        case "patch-notes":
          setPatch(true);
          return;
      }
    };
    // an effect whose chunk can't load (offline, PART 18) still counts as found, and says so
    const run = (id: EggId, how: "found" | "trigger" = "found") =>
      play(id, how).catch(() => {
        const egg = EGG_BY_ID[id];
        if (egg) command({ type: "item", kicker: "Egg found", title: egg.name, detail: "Its effect didn't load — check your connection" });
      });

    // ── typed words + the cheat code (the keyboard manager forwards keys it didn't use) ────────────────────────────
    let letters = "";
    let seq: string[] = [];
    let lastKey = 0;
    const offKey = bus.on("egg:key", ({ key }) => {
      const now = performance.now();
      if (now - lastKey > EGG_TIMING.wordGapMs) letters = "";
      if (now - lastKey > EGG_TIMING.wordGapMs * 2) seq = [];
      lastKey = now;
      const k = key.length === 1 ? key.toLowerCase() : key;
      seq = [...seq, k].slice(-CHEAT_CODE.length);
      if (seq.length === CHEAT_CODE.length && seq.every((v, i) => v === CHEAT_CODE[i])) {
        seq = [];
        letters = "";
        void run("cheat-code");
        return;
      }
      if (/^[a-z]$/.test(k)) {
        letters = (letters + k).slice(-12);
        const hit = Object.keys(TYPED_WORDS).find((w) => letters.endsWith(w));
        if (hit) {
          letters = "";
          void run(TYPED_WORDS[hit]);
        }
      } else letters = "";
    });

    // ── the four corners (hold the pointer 600ms; touch: a long-press) ──────────────────────────────────────────
    const zoneOf = (x: number, y: number): Corner | null => {
      // the content box's corners: with a classic scrollbar (WebKit, Windows) the window's edge is the scrollbar
      const W = document.documentElement.clientWidth || innerWidth;
      const H = document.documentElement.clientHeight || innerHeight;
      const z = EGG_TIMING.cornerPx;
      const l = x <= z;
      const r = x >= W - z;
      const t = y <= z;
      const b = y >= H - z;
      return t && l ? "top-left" : t && r ? "top-right" : b && l ? "bottom-left" : b && r ? "bottom-right" : null;
    };
    let armed: Corner | null = null;
    let fired: Corner | null = null;
    let cornerTimer = 0;
    let touchFrom: { x: number; y: number } | null = null;
    const arm = (c: Corner | null, after?: () => void) => {
      if (c !== fired) fired = null; // leaving a corner re-arms it
      if (c === armed) return;
      window.clearTimeout(cornerTimer);
      armed = c;
      if (!c || c === fired) return;
      cornerTimer = window.setTimeout(() => {
        armed = null;
        fired = c;
        if (busy()) return;
        after?.();
        void run(`corner-${c}`);
      }, EGG_TIMING.cornerHoldMs);
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer = { x: e.clientX, y: e.clientY };
        if (e.pointerType === "touch") {
          if (touchFrom && Math.hypot(e.clientX - touchFrom.x, e.clientY - touchFrom.y) > 12) arm(null);
          return;
        }
        arm(zoneOf(e.clientX, e.clientY));
      },
      on,
    );
    window.addEventListener(
      "pointerout",
      (e) => {
        if (!e.relatedTarget) arm(null); // the pointer left the window
      },
      on,
    );
    window.addEventListener("blur", () => arm(null), on);
    // touch: the long-press that finds a corner mustn't also press whatever is under the finger
    const swallowClick = () => {
      const stop = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      window.addEventListener("click", stop, { capture: true, once: true });
      later(() => window.removeEventListener("click", stop, { capture: true }), 700);
    };
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType !== "touch") return;
        const c = zoneOf(e.clientX, e.clientY);
        touchFrom = c ? { x: e.clientX, y: e.clientY } : null;
        arm(c, swallowClick);
      },
      on,
    );
    const endTouch = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touchFrom = null;
      arm(null);
    };
    window.addEventListener("pointerup", endTouch, on);
    window.addEventListener("pointercancel", endTouch, on);

    // ── selecting the word BYTE ─────────────────────────────────────────────────────────────────────────────────
    let lastSel = "";
    let selTimer = 0;
    document.addEventListener(
      "selectionchange",
      () => {
        window.clearTimeout(selTimer);
        selTimer = window.setTimeout(() => {
          const text = window.getSelection()?.toString() ?? "";
          if (!text.trim()) {
            lastSel = "";
            return;
          }
          if (text !== lastSel && /\bbyte\b/i.test(text)) void run("select-byte");
          lastSel = text;
        }, 280);
      },
      on,
    );

    // ── idle: 45s → BYTE sleeps (its brain) + the grid's attract lap; 90s → "Bored?" ────────────────────────────
    let lastInput = performance.now();
    let stage = 0;
    let idleTimer = 0;
    const tickIdle = () => {
      idleTimer = 0;
      const quiet = performance.now() - lastInput;
      const ok = !document.hidden && !busy() && !speedrun();
      if (stage === 0 && quiet >= SLEEP) {
        stage = 1;
        if (ok) void run("idle-sleep");
      }
      if (stage === 1 && quiet >= BORED) {
        stage = 2;
        if (ok) void run("idle-bored");
      }
      const target = stage === 0 ? SLEEP : stage === 1 ? BORED : 0;
      if (target) idleTimer = window.setTimeout(tickIdle, Math.max(50, target - quiet + 30));
    };
    let boredGrace = 0;
    const onInput = () => {
      lastInput = performance.now();
      if (stage !== 0) stage = 0;
      if (!idleTimer) idleTimer = window.setTimeout(tickIdle, SLEEP + 30);
      // the chip outlives the wake-up a little, so the pointer can still reach it
      if (!boredGrace) boredGrace = later(() => {
        boredGrace = 0;
        if (performance.now() - lastInput < BORED) setBored(false);
      }, 8000);
    };
    for (const t of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const) window.addEventListener(t, onInput, on);
    idleTimer = window.setTimeout(tickIdle, SLEEP + 30);

    // ── the proctor (QuizMUJ's tab-switch tracking) ─────────────────────────────────────────────────────────────
    let realTitle = document.title;
    let iconHref: string | null = null;
    let caught = false;
    const iconLink = () => document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    document.addEventListener(
      "visibilitychange",
      () => {
        if (speedrun()) return;
        const link = iconLink();
        if (document.hidden) {
          if (document.title !== TAB_TITLE) realTitle = document.title;
          document.title = TAB_TITLE;
          if (link) {
            iconHref = link.href;
            link.href = sadFavicon();
          }
          return;
        }
        if (document.title === TAB_TITLE) document.title = realTitle;
        if (link && iconHref) link.href = iconHref;
        iconHref = null;
        if (!caught) {
          caught = true;
          void run("proctor");
        }
      },
      on,
    );

    // ── night owl · DevTools · patch notes (once, at start) ─────────────────────────────────────────────────────
    if (!speedrun()) {
      if (isNightOwlHour()) void run("night-owl");
      printBanner(false, () => found("devtools"), toLobby);
    }
    {
      const s = useSave.getState();
      if (s.meta.contentHash === null) s.setContentHash(data.contentHash);
      else if (s.meta.contentHash !== data.contentHash && !speedrun())
        later(() => {
          useSave.getState().setContentHash(data.contentHash);
          void run("patch-notes");
        }, 2500);
    }

    // ── loot chests (≈ 1 in 15 world visits, at most 3 a session) ──────────────────────────────────────────────
    function showChest() {
      // a gutter beside the page's column — never over the text (R6); phones have none, so no chest there
      const shell = document.querySelector("main .shell");
      const r = shell?.getBoundingClientRect();
      const left = r ? r.left : 0;
      const right = r ? innerWidth - r.right : 0;
      const room = 76;
      const x = left >= room ? left / 2 : right >= room + 64 ? innerWidth - right / 2 - 32 : -1; // the rail sits on the right
      if (x < 0) return;
      const fact = data.facts[Math.floor(Math.random() * data.facts.length)] ?? "";
      const y = innerHeight * (0.3 + Math.random() * 0.35);
      setChest({ key: Date.now(), x, y, fact });
      sfx.play("pop", { pitch: 1.3 });
      later(() => setChest(null), EGG_TIMING.chestMs);
    }
    const offWorld = bus.on("world:enter", () => {
      if (speedrun() || busy() || chestsShown.current >= EGG_TIMING.chestMax) return;
      const odds = qa?.chestOdds ?? 1 / EGG_TIMING.chestOdds;
      if (Math.random() >= odds) return;
      chestsShown.current += 1;
      later(() => void run("loot-chest"), 900);
    });

    // ── milestones: 100 clicks, 5 minutes, every world ───────────────────────────────────────────────────────────
    let unflushed = 0;
    const milestones = () => {
      if (speedrun()) return;
      const s = useSave.getState();
      const has = (id: string) => s.stats.eggsFound.includes(id);
      if (!has("milestone-clicks") && s.stats.clicks + unflushed >= EGG_TIMING.milestoneClicks) void run("milestone-clicks");
      if (!has("milestone-time") && s.stats.timePlayedMs >= EGG_TIMING.milestonePlayedMs) void run("milestone-time");
      if (!has("milestone-worlds") && s.achievements.explorer) void run("milestone-worlds");
    };
    window.addEventListener(
      "pointerdown",
      () => {
        unflushed += 1;
        milestones();
      },
      { signal: abort.signal, passive: true, capture: true },
    );
    const offSave = useSave.subscribe((s, prev) => {
      if (s.stats.clicks !== prev.stats.clicks) unflushed = 0; // the stats tracker flushed its count
      if (s.stats !== prev.stats || s.achievements !== prev.achievements) milestones();
    });

    // ── hidden coins: spin-in, sparkle, a flight to the HUD, the chip bumps ──────────────────────────────────────
    const offCoin = bus.on("coin:collected", ({ origin }) => void effects().then((E) => E.coinCeremony(origin, reduced()), () => {}));

    // ── the right-click menu (Shift keeps the browser's; links, fields, media, dialogs and selections keep theirs) ─
    window.addEventListener(
      "contextmenu",
      (e) => {
        if (e.shiftKey) return;
        const t = e.target instanceof Element ? e.target : null;
        // something handled its own right-click — except a 3D canvas outside a game, which only prevents it
        // (three's OrbitControls on the Title island)
        if (e.defaultPrevented && !(t instanceof HTMLCanvasElement && !t.closest(".gshell"))) return;
        if (!t || t.closest('a[href], input, textarea, select, [contenteditable=""], [contenteditable="true"], img, video, audio, svg image, dialog, [popover], [data-native-menu], .gshell')) return;
        if ((window.getSelection()?.toString() ?? "").trim()) return;
        e.preventDefault();
        found("context-menu");
        // keyboard-opened (the menu key): place it at the focused element
        const fromKeys = e.button !== 2 || (e.clientX === 0 && e.clientY === 0);
        const a = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const ar = fromKeys && a && a !== document.body ? a.getBoundingClientRect() : null;
        setMenu({ x: ar ? ar.left + 8 : e.clientX, y: ar ? ar.bottom + 4 : e.clientY, returnTo: a });
      },
      { signal: abort.signal },
    );
    const offMenu = bus.on("menu:open", ({ x, y }) => {
      const a = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const ar = a && a !== document.body ? a.getBoundingClientRect() : null;
      found("context-menu");
      setMenu({ x: x ?? (ar ? ar.left + 8 : innerWidth / 2), y: y ?? (ar ? ar.bottom + 4 : innerHeight / 2), returnTo: a });
    });

    // ── /playground/eggs and command({ type: "egg" }) ───────────────────────────────────────────────────────────
    const offTrigger = bus.on("egg:trigger", ({ id }) => {
      if (EGG_BY_ID[id]) void run(id as EggId, "trigger");
    });

    return () => {
      abort.abort();
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(cornerTimer);
      window.clearTimeout(idleTimer);
      window.clearTimeout(selTimer);
      offKey();
      offWorld();
      offSave();
      offCoin();
      offMenu();
      offTrigger();
    };
  }, [data]);

  return (
    <>
      {menu ? <ContextMenu at={menu} resumeHref={resumeHref} email={data.terminal.email} onClose={() => setMenu(null)} /> : null}
      {gear ? (
        <button
          type="button"
          className="egg-gear"
          aria-label="Secret gear — switch on CHAOS mode"
          onClick={() => {
            useSave.getState().setSetting("fx", "chaos");
            sfx.play("powerUp");
            command({ type: "item", kicker: "Secret gear", title: "CHAOS MODE", detail: "Maximum juice. Pause → Settings turns it back down" });
            setGear(false);
          }}
        >
          <PixelIcon name="gear" size={32} />
        </button>
      ) : null}
      {chest ? (
        <button
          key={chest.key}
          type="button"
          className="egg-chest"
          style={{ left: chest.x - 28, top: chest.y - 28 }}
          aria-label={`A loot chest — open it for 50 XP and a ${data.factsAreFun ? "fun fact" : "did-you-know"}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            useSave.getState().addXp(50, `chest:${Date.now()}`, origin);
            fx.burst(origin.x, origin.y, { shape: "coin", count: 10 });
            sfx.play("coin");
            command({ type: "item", kicker: "Loot! +50 XP", title: data.factsAreFun ? "Fun fact" : "Did you know?", detail: chest.fact });
            setChest(null);
          }}
        >
          <PixelIcon name="chest" size={48} />
        </button>
      ) : null}
      {bored ? (
        <div className="egg-bored" role="status">
          <button
            type="button"
            className="egg-bored__go"
            onClick={() => {
              setBored(false);
              useUi.getState().openGame("bug-whack");
            }}
          >
            <PixelIcon name="bug" size={16} mono /> Bored? Squash some bugs
          </button>
          <button type="button" className="egg-bored__x" aria-label="Dismiss" onClick={() => setBored(false)}>
            ×
          </button>
        </div>
      ) : null}
      {proctor ? (
        <div className="egg-proctor" role="status">
          <span>{data.proctor}</span>
          <button type="button" className="egg-proctor__x" aria-label="Dismiss the proctor's notice" onClick={() => setProctor(false)}>
            ×
          </button>
        </div>
      ) : null}
      {patch ? <PatchToast onClose={() => setPatch(false)} /> : null}
    </>
  );
}

function PatchToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 12000);
    return () => window.clearTimeout(t);
  }, [onClose]);
  return (
    <div className="egg-patch" role="status">
      <p className="egg-patch__title">PATCH NOTES v{LATEST_PATCH}</p>
      <p className="egg-patch__text">New content since your last visit.</p>
      <div className="egg-patch__actions">
        <button
          type="button"
          className="egg-patch__go"
          onClick={() => {
            onClose();
            useUi.getState().openPause("patch");
          }}
        >
          Read the patch notes
        </button>
        <button type="button" className="egg-patch__x" onClick={onClose}>
          Later
        </button>
      </div>
    </div>
  );
}

/** A sad pixel face as an SVG data URL for the tab while it's hidden (no request — R10). */
function sadFavicon(): string {
  const rows = [
    "...kkkkkkkkkk...",
    "..kaaaaaaaaaak..",
    ".kaaaaaaaaaaaak.",
    "kaaaaaaaaaaaaaak",
    "kaaakkaaaakkaaak",
    "kaaakkaaaakkaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaabaaaaaaaak",
    "kaaaaabaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaakkkkaaaaak",
    "kaaaakaaaakaaaak",
    "kaaaaaaaaaaaaaak",
    ".kaaaaaaaaaaaak.",
    "..kaaaaaaaaaak..",
    "...kkkkkkkkkk...",
  ];
  const fill: Record<string, string> = { k: "#07060F", a: "#FFD23F", b: "#22D3EE" };
  let d = "";
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== "." && (d += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill[ch]}"/>`)));
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${d}</svg>`)}`;
}
