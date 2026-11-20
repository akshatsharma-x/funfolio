"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENT_BY_ID } from "@/content/achievements";
import { PRIZE_BY_ID } from "@/content/prizes";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { announce } from "@/lib/announce";
import { bus } from "@/lib/bus";
import { useHtmlAttribute } from "@/lib/hooks/useHtmlAttribute";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { setSpeedrun } from "./useGameRuntime";

const TOAST_MS = 2600;

type Toast = { key: number; kind: "achievement" | "item"; kicker: string; title: string; detail?: string; icon: PixelIconName; xp?: number };

const canPopover = (el: HTMLElement | null): el is HTMLElement => !!el && typeof el.showPopover === "function";
const show = (el: HTMLElement | null) => {
  if (canPopover(el) && !el.matches(":popover-open")) el.showPopover();
};
const hide = (el: HTMLElement | null) => {
  if (canPopover(el) && el.matches(":popover-open")) el.hidePopover();
};

/**
 * Toasts (PART 3 #4): a sticker card drops from top-center with a bounce. One at a time (2.6s, hover pauses),
 * achievements get the hex badge + "+XP" roll; smaller "ITEM ACQUIRED" toasts for coins, copies and downloads.
 * Text is mirrored into the polite live region (lib/announce.ts); the visual toast itself is aria-hidden.
 */
export function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null);
  // PART 11: while an arcade game is open its results screen lists the rewards — toasts wait and play afterwards
  const gameOpen = useUi((s) => !!s.game);
  const gameOpenRef = useRef(gameOpen);
  const hostRef = useRef<HTMLDivElement>(null);
  const queue = useRef<Toast[]>([]);
  const busy = useRef(false);
  const seq = useRef(0);
  const timer = useRef(0);
  const remaining = useRef(TOAST_MS);
  const startedAt = useRef(0);

  const advance = useCallback(() => {
    const next = queue.current.shift() ?? null;
    busy.current = next !== null;
    setToast(next);
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "key">) => {
      seq.current += 1;
      queue.current.push({ ...t, key: seq.current });
      if (!busy.current && !gameOpenRef.current) advance();
    },
    [advance],
  );

  useEffect(() => {
    gameOpenRef.current = gameOpen;
    if (!gameOpen && !busy.current && queue.current.length) advance();
  }, [gameOpen, advance]);

  const leave = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    host.setAttribute("data-leaving", "");
    window.setTimeout(
      () => {
        host.removeAttribute("data-leaving");
        if (gameOpenRef.current) {
          busy.current = false;
          setToast(null);
        } else advance();
      },
      prefersReducedMotion() ? 0 : 220,
    );
  }, [advance]);

  const startTimer = useCallback(
    (ms: number) => {
      window.clearTimeout(timer.current);
      startedAt.current = performance.now();
      remaining.current = ms;
      timer.current = window.setTimeout(leave, ms);
    },
    [leave],
  );

  useEffect(() => {
    const offs = [
      bus.on("achievement:unlocked", ({ id }) => {
        const a = ACHIEVEMENT_BY_ID[id];
        if (a) push({ kind: "achievement", kicker: "Achievement unlocked", title: a.title, detail: a.description, icon: a.icon, xp: a.xp });
      }),
      bus.on("coin:collected", ({ name, found, total }) =>
        push({ kind: "item", kicker: "Item acquired", title: name, detail: `Hidden coins ${found}/${total}`, icon: "coin" }),
      ),
      bus.on("item:acquired", ({ title, detail, icon, kicker }) =>
        push({ kind: "item", kicker: kicker ?? "Item acquired", title, detail, icon: (icon as PixelIconName | undefined) ?? "chest" }),
      ),
    ];
    return () => offs.forEach((off) => off());
  }, [push]);

  useEffect(() => {
    const host = hostRef.current;
    if (!toast) {
      hide(host);
      return;
    }
    show(host);
    announce(`${toast.kicker}: ${toast.title}.${toast.detail ? ` ${toast.detail}` : ""}${toast.xp ? ` Plus ${toast.xp} XP.` : ""}`);
    startTimer(TOAST_MS);
    return () => window.clearTimeout(timer.current);
  }, [toast, startTimer]);

  return (
    <div
      ref={hostRef}
      popover="manual"
      className="toast-host"
      aria-hidden="true"
      onPointerEnter={() => {
        window.clearTimeout(timer.current);
        remaining.current -= performance.now() - startedAt.current;
      }}
      onPointerLeave={() => {
        if (busy.current) startTimer(Math.max(700, remaining.current));
      }}
    >
      {toast ? (
        <div key={toast.key} className="toast" data-kind={toast.kind}>
          <span className="toast__badge">
            <PixelIcon name={toast.icon} size={32} />
          </span>
          <span className="toast__text">
            <span className="toast__kicker">{toast.kicker}</span>
            <span className="toast__title">{toast.title}</span>
            {toast.detail ? <span className="toast__detail">{toast.detail}</span> : null}
          </span>
          {toast.xp ? (
            <span className="toast__xp">
              +<NumberRoll value={String(toast.xp)} play="mount" /> XP
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type LevelUp = { key: number; level: number; title: string; rewards: string[] };

/** Non-blocking level-up banner + confetti + what it unlocked (the levelUp sfx is wired in useBusWiring). */
export function LevelUpBanner() {
  const [data, setData] = useState<LevelUp | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  // PART 11: a level-up earned inside an arcade game shows on its results screen; the banner waits for the exit
  const gameOpen = useUi((s) => !!s.game);
  const gameOpenRef = useRef(gameOpen);
  const held = useRef<LevelUp | null>(null);

  useEffect(
    () =>
      bus.on("level:up", ({ level, title, rewards }) => {
        seq.current += 1;
        const next = { key: seq.current, level, title, rewards };
        if (gameOpenRef.current) held.current = next;
        else setData(next);
      }),
    [],
  );
  useEffect(() => {
    gameOpenRef.current = gameOpen;
    if (!gameOpen && held.current) {
      const next = held.current;
      held.current = null;
      const t = window.setTimeout(() => setData(next), 400);
      return () => window.clearTimeout(t);
    }
  }, [gameOpen]);

  useEffect(() => {
    const el = ref.current;
    if (!data) {
      hide(el);
      return;
    }
    show(el);
    const names = data.rewards.map((id) => PRIZE_BY_ID[id]?.name).filter(Boolean);
    announce(`Level up! Level ${data.level}, ${data.title}.${names.length ? ` Unlocked: ${names.join(", ")}.` : ""}`);
    fx.confetti({ style: useSave.getState().inventory.equipped.confetti });
    const t = window.setTimeout(() => setData(null), 3600);
    return () => window.clearTimeout(t);
  }, [data]);

  const rewards = data?.rewards.map((id) => PRIZE_BY_ID[id]?.name).filter(Boolean) ?? [];
  return (
    <div ref={ref} popover="manual" className="levelup" aria-hidden="true">
      {data ? (
        <div key={data.key} className="levelup__card">
          <span className="levelup__kicker">Level up!</span>
          <span className="levelup__title text-rainbow">
            LV {data.level} · {data.title}
          </span>
          {rewards.length ? <span className="levelup__reward">Unlocked: {rewards.join(", ")}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/** "+XP" ghosts fly from where XP was earned into the HUD bar (skipped under reduced motion). */
export function XpGhosts() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      bus.on("xp:gained", ({ amount, origin }) => {
        const root = layer.current;
        const bar = document.querySelector("[data-hud-xp]")?.getBoundingClientRect();
        if (!root || !origin || !bar || prefersReducedMotion()) return;
        const ghost = document.createElement("span");
        ghost.className = "xp-ghost";
        // generated content, not a text node: a decorative (aria-hidden) flourish that fades as it flies — the real
        // value is the HUD's XP bar; axe read the half-faded text as low contrast (PART 18)
        ghost.dataset.text = `+${amount} XP`;
        ghost.style.left = `${origin.x}px`;
        ghost.style.top = `${origin.y}px`;
        root.append(ghost);
        const dx = bar.left + bar.width / 2 - origin.x;
        const dy = bar.top + bar.height / 2 - origin.y;
        const flight = ghost.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
            { transform: "translate(-50%, -140%) scale(1.15)", opacity: 1, offset: 0.25 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.45)`, opacity: 0.25 },
          ],
          { duration: 950, easing: "cubic-bezier(0.55, 0, 0.75, 0.2)" },
        );
        flight.onfinish = () => ghost.remove();
      }),
    [],
  );
  return <div ref={layer} className="xp-ghosts" aria-hidden="true" />;
}

/** Floating "▶ Back to Play Mode" pill while Recruiter Speedrun Mode is on. */
export function SpeedrunPill() {
  const mode = useHtmlAttribute("data-mode", "play");
  if (mode !== "speedrun") return null;
  return (
    <aside className="speedrun-pill" aria-label="Recruiter Speedrun Mode">
      <ArcadeButton icon="controller" cursorLabel="PLAY" onClick={() => setSpeedrun(false)}>
        <span aria-hidden="true">▶ </span>Back to Play Mode
      </ArcadeButton>
    </aside>
  );
}
