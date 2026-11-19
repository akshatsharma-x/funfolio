"use client";

import { useEffect, useRef, type ButtonHTMLAttributes } from "react";
import { worldById, worldLabel } from "@/content/worlds";
import { levelProgress, MAX_LEVEL } from "@/content/levels";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { Tooltip } from "@/components/ui/Tooltip";
import { bus } from "@/lib/bus";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { switchTheme } from "./useGameRuntime";

type HudButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  /** Shown in the tooltip and exposed as aria-keyshortcuts. */
  shortcut?: string;
  icon: PixelIconName;
  pressed?: boolean;
  /** Small "new" dot (e.g. unseen patch notes). */
  badge?: boolean;
};

/** Square HUD button: pixel icon + tooltip with the keyboard shortcut. */
export function HudButton({ label, shortcut, icon, pressed, badge, className, ...rest }: HudButtonProps) {
  return (
    <Tooltip title={label} typeLine={shortcut ? `Shortcut · ${shortcut}` : undefined}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        aria-keyshortcuts={shortcut}
        className={cn("hud-btn", className)}
        {...rest}
      >
        <PixelIcon name={icon} mono />
        {badge ? <span className="hud-btn__badge" aria-hidden="true" /> : null}
      </button>
    </Tooltip>
  );
}

/** Segmented XP bar in --world; shimmers whenever XP lands. */
export function XpBar() {
  const xp = useSave((s) => s.player.xp);
  const ref = useRef<HTMLDivElement>(null);
  const p = levelProgress(xp);
  const segments = 10;
  const lit = p.level >= MAX_LEVEL ? segments : Math.floor(p.ratio * segments);

  useEffect(
    () =>
      bus.on("xp:gained", () => {
        const el = ref.current;
        if (!el || prefersReducedMotion()) return;
        el.removeAttribute("data-shimmer");
        void el.offsetWidth; // restart the animation
        el.setAttribute("data-shimmer", "");
      }),
    [],
  );

  const text = p.level >= MAX_LEVEL ? `${xp} XP, max level` : `${p.into} of ${p.span} XP to level ${p.level + 1}`;
  return (
    <div
      ref={ref}
      className="hud-xp"
      data-hud-xp=""
      role="progressbar"
      aria-label={`Experience: ${text}`}
      aria-valuemin={0}
      aria-valuemax={p.span || 1}
      aria-valuenow={p.span ? p.into : 1}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="hud-xp__seg" data-on={i < lit ? "" : undefined} />
      ))}
    </div>
  );
}

/** "WORLD 3 · THE LAB · Research" with a typewriter swap (instant under reduced motion). */
export function WorldLabel() {
  const id = useUi((s) => s.currentWorld);
  const page = useUi((s) => s.pageLabel);
  const w = worldById[id];
  const label = worldLabel(w);
  const visual = page ? page.toUpperCase() : [label.toUpperCase(), w.gameTitle.toUpperCase(), w.hudTitle].filter(Boolean).join(" · ");
  const spoken = page ?? [label, w.gameTitle, w.hudTitle].filter(Boolean).join(", ");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = visual;
      return;
    }
    let i = 0;
    const timer = window.setInterval(() => {
      i += 2;
      el.textContent = visual.slice(0, i);
      if (i >= visual.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [visual]);

  return (
    <p className="hud-world">
      {/* the whole label, invisible, holds the width while the typed copy fills in (no layout shift, PART 17) */}
      <span className="hud-world__text" aria-hidden="true">
        <span className="hud-world__ghost">{visual}</span>
        <span ref={ref} className="hud-world__typed" />
      </span>
      <span className="sr-only">{page ? `Page: ${spoken}` : `Current world: ${spoken}`}</span>
    </p>
  );
}

/** Day/night toggle — sun ↔ moon pixel morph, circular sweep from the button. */
export function ThemeToggle({ theme }: { theme: string }) {
  const night = theme !== "day";
  const label = night ? "Switch to day theme" : "Switch to night theme";
  return (
    <Tooltip title={label} typeLine="Shortcut · Shift+D">
      <button
        type="button"
        className="hud-btn hud-theme"
        data-hud-theme=""
        data-night={night ? "" : undefined}
        aria-label={label}
        aria-keyshortcuts="Shift+D"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          switchTheme("toggle", { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }}
      >
        <span className="hud-theme__icon hud-theme__sun">
          <PixelIcon name="sun" mono />
        </span>
        <span className="hud-theme__icon hud-theme__moon">
          <PixelIcon name="moon" mono />
        </span>
      </button>
    </Tooltip>
  );
}
