"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import type { CursorLabel } from "@/components/cursor/skins";
import { cn } from "@/lib/cn";
import { command as runCommand, type Command } from "@/lib/commands";
import { sfx, type SfxName } from "@/lib/sfx";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  /** primary = world color · secondary = surface · ghost = outline · danger = red */
  variant?: Variant;
  size?: Size;
  /** circle = icon-only (give it an aria-label). */
  shape?: "pill" | "circle";
  icon?: PixelIconName;
  iconRight?: PixelIconName;
  /** Shows "LOADING" + pixel dots, sets aria-busy and blocks clicks. */
  loading?: boolean;
  /** Sound on click (silent until PART 3; sound is OFF by default). `false` = no sound. */
  sfx?: SfxName | false;
  /** Context word shown under the cursor follower after 120ms hover (PART 2 vocabulary). */
  cursorLabel?: CursorLabel;
  /** Game-runtime command(s) to run on click — plain objects, so Server Components can pass them. */
  command?: Command | Command[];
  className?: string;
  children?: ReactNode;
};

type NativeButton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
type NativeLink = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };
export type ArcadeButtonProps = BaseProps & (NativeButton | NativeLink);

/** Chunky pill/circle arcade button: 3px outline, glossy top half, squash on press (Bible §3). */
export function ArcadeButton(props: ArcadeButtonProps) {
  const {
    variant = "primary",
    size = "md",
    shape = "pill",
    icon,
    iconRight,
    loading = false,
    sfx: sound = "click",
    cursorLabel,
    command,
    className,
    children,
    ...native
  } = props;

  const data = {
    className: cn("arcade-btn", className),
    "data-variant": variant === "primary" ? undefined : variant,
    "data-size": size === "md" ? undefined : size,
    "data-shape": shape === "circle" ? "circle" : undefined,
    "data-cursor-label": cursorLabel,
  };
  const iconSize = shape === "circle" && size === "lg" ? 32 : 16;
  const content = loading ? (
    <>
      <span>Loading</span>
      <span className="pixel-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </>
  ) : (
    <>
      {icon ? <PixelIcon name={icon} size={iconSize} mono /> : null}
      {children}
      {iconRight ? <PixelIcon name={iconRight} size={iconSize} mono /> : null}
    </>
  );
  const onHover = () => sfx.play("hover");
  const play = (target: HTMLElement) => {
    if (sound) sfx.play(sound);
    if (!command) return;
    const r = target.getBoundingClientRect();
    const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    // attach the click origin so "+XP" ghosts fly from the button
    const withOrigin = (c: Command): Command =>
      c.type === "cta" || c.type === "xp" || c.type === "coin" || c.type === "theme" ? { ...c, origin } : c;
    runCommand(...(Array.isArray(command) ? command : [command]).map(withOrigin));
  };

  if (typeof native.href === "string") {
    const { onClick, ...anchor } = native as NativeLink;
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      play(e.currentTarget);
      onClick?.(e);
    };
    return (
      <a {...anchor} {...data} onClick={handleClick} onPointerEnter={onHover}>
        {content}
      </a>
    );
  }

  const { onClick, type = "button", disabled, ...button } = native as NativeButton;
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    play(e.currentTarget);
    onClick?.(e);
  };
  return (
    <button
      {...button}
      {...data}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
      onPointerEnter={onHover}
    >
      {content}
    </button>
  );
}
