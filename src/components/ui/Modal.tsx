"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { cn } from "@/lib/cn";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { ArcadeButton } from "./ArcadeButton";
import { PixelFrame } from "./PixelFrame";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Close by clicking the backdrop (default true; games may turn it off). */
  dismissOnBackdrop?: boolean;
  /** md = 560px dialogs · lg = 900px (pause menu) · full = the arcade's game screen. */
  size?: "md" | "lg" | "full";
  className?: string;
  /** Esc first asks this (a game pauses instead of closing); return true when it handled the key. */
  onEscape?: () => boolean;
};

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

/** What Tab can reach: no tabindex=-1 (roving tabs), nothing disabled, hidden (inactive tab panels) or unrendered,
 * and only the checked radio of a group that has one. */
function tabbable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.tabIndex < 0 || el.matches(":disabled") || el.closest("[hidden], [inert]") || el.getClientRects().length === 0) return false;
    if (el instanceof HTMLInputElement && el.type === "radio" && !el.checked && el.name) {
      const group = root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`);
      if (Array.from(group).some((r) => r.checked)) return false;
    }
    return true;
  });
}

/**
 * Native <dialog> modal: top layer (never covers the cursor — R2), focus trap + restore, Esc, scroll lock that keeps
 * Lenis in sync, pop-in from 0.9 + blurred backdrop (fade only under reduced motion).
 */
export function Modal({ open, onClose, title, description, children, footer, dismissOnBackdrop = true, size = "md", className, onEscape }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const locked = useRef(false);
  const titleId = useId();
  const descId = useId();

  const release = () => {
    if (!locked.current) return;
    locked.current = false;
    unlockScroll();
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.removeAttribute("data-closing");
      dialog.showModal();
      if (!locked.current) {
        locked.current = true;
        lockScroll();
      }
      sfx.play("open");
      return;
    }
    if (!open && dialog.open) {
      sfx.play("close");
      dialog.setAttribute("data-closing", "");
      const timer = window.setTimeout(() => {
        dialog.removeAttribute("data-closing");
        dialog.close();
      }, 160);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // Unmounting while open must not leave the page scroll-locked.
  useEffect(() => () => release(), []);

  /** Fires for dialog.close() and for browser-forced closes; keeps parent state, scroll lock and focus in sync. */
  const handleClose = () => {
    release();
    returnFocus.current?.focus();
    returnFocus.current = null;
    if (open) onClose();
  };

  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault(); // animate out instead of closing instantly
    // (browsers only honour this once per user activation: a second Esc in a row closes the dialog regardless)
    if (onEscape?.()) return;
    onClose();
  };

  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
  };

  // Focus trap: Tab / Shift+Tab move through the dialog's controls explicitly and wrap at the ends. Explicit (not
  // just at the edges) so every engine behaves the same — Safari's default Tab skips buttons and links, which would
  // otherwise make the first/last guess wrong and let focus slip out to the browser UI.
  const trapTab = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
    const dialog = e.currentTarget;
    const items = tabbable(dialog);
    if (items.length === 0) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const forward = !e.shiftKey;
    const i = active ? items.indexOf(active) : -1;
    let target: HTMLElement | undefined;
    if (i >= 0) target = items[(i + (forward ? 1 : -1) + items.length) % items.length];
    else if (active && dialog.contains(active) && active !== dialog) {
      // focus sits on something outside the list (e.g. a panel's child) — continue from its place in the DOM
      target = forward
        ? items.find((el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        : items.findLast((el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
    }
    target ??= forward ? items[0] : items[items.length - 1];
    e.preventDefault();
    target.focus();
  };

  return (
    <dialog
      ref={ref}
      className={cn("modal", className)}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleClick}
      onKeyDown={trapTab}
      data-lenis-prevent=""
    >
      <PixelFrame>
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <ArcadeButton variant="ghost" size="sm" sfx={false} onClick={onClose}>
            Eject<span className="sr-only"> (close dialog)</span>
          </ArcadeButton>
        </div>
        {description ? (
          <p id={descId} className="mb-4 text-muted">
            {description}
          </p>
        ) : null}
        <div className="modal__body">{children}</div>
        {/* Game announcements while this dialog is open land here — everything outside a modal dialog is inert. */}
        <div data-announcer="" role="status" aria-live="polite" className="sr-only" />
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </PixelFrame>
    </dialog>
  );
}
