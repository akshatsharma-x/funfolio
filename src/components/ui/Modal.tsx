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
  className?: string;
};

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Native <dialog> modal: top layer (never covers the cursor — R2), focus trap + restore, Esc, scroll lock that keeps
 * Lenis in sync, pop-in from 0.9 + blurred backdrop (fade only under reduced motion).
 */
export function Modal({ open, onClose, title, description, children, footer, dismissOnBackdrop = true, className }: ModalProps) {
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
    onClose();
  };

  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
  };

  const trapTab = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      className={cn("modal", className)}
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
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </PixelFrame>
    </dialog>
  );
}
