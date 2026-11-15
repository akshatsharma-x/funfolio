"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type TooltipProps = {
  /** Item name, e.g. "Python". */
  title: string;
  /** Game-item type line, e.g. "Weapon · Language". */
  typeLine?: string;
  body?: ReactNode;
  /** The trigger: should contain one focusable element (button/link), which gets aria-describedby. */
  children: ReactNode;
};

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

const GAP = 10;
const EDGE = 8;

/**
 * Game-item tooltip (title · type line · body). Opens on hover and focus, stays open while hovered, Esc dismisses
 * (WCAG 1.4.13). Rendered in the top layer via the Popover API, so cards with overflow or transforms never clip it.
 */
export function Tooltip({ title, typeLine, body, children }: TooltipProps) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const show = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setOpen(true);
  }, []);

  const hide = useCallback((delay = 90) => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), delay);
  }, []);

  const position = useCallback(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    let top = a.top - t.height - GAP;
    if (top < EDGE) top = a.bottom + GAP;
    const left = Math.min(Math.max(a.left + a.width / 2 - t.width / 2, EDGE), window.innerWidth - t.width - EDGE);
    tip.style.top = `${Math.round(top)}px`;
    tip.style.left = `${Math.round(left)}px`;
  }, []);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!tip || typeof tip.showPopover !== "function") {
      if (open) position();
      return;
    }
    const isOpen = tip.matches(":popover-open");
    if (open && !isOpen) tip.showPopover();
    if (!open && isOpen) tip.hidePopover();
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", position, { passive: true, capture: true });
    window.addEventListener("resize", position);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", position, { capture: true });
      window.removeEventListener("resize", position);
    };
  }, [open, position]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Wire aria-describedby onto the focusable trigger. Done on the DOM (not cloneElement) because children may come
  // from a Server Component, where React can hand them over as lazy references that can't be cloned.
  useEffect(() => {
    const trigger = anchorRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    if (!trigger) return;
    const previous = trigger.getAttribute("aria-describedby");
    trigger.setAttribute("aria-describedby", previous ? `${previous} ${id}` : id);
    return () => {
      if (previous) trigger.setAttribute("aria-describedby", previous);
      else trigger.removeAttribute("aria-describedby");
    };
  }, [id]);

  return (
    <span
      ref={anchorRef}
      className="inline-flex max-w-full"
      onPointerEnter={show}
      onPointerLeave={() => hide()}
      onFocus={show}
      onBlur={() => hide(0)}
    >
      {children}
      <span
        ref={tipRef}
        id={id}
        role="tooltip"
        popover="manual"
        className="tooltip"
        data-open={open ? "" : undefined}
      >
        <span className="tooltip__title">{title}</span>
        {typeLine ? <span className="tooltip__type">{typeLine}</span> : null}
        {body ? <span className="tooltip__body">{body}</span> : null}
      </span>
    </span>
  );
}
