"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { startCursorEngine } from "./engine";

/**
 * Fun layer (PART 2): decorative follower ring, label pill, trail and locator pings. Mounted only for a fine,
 * hover-capable pointer — touch gets no fun layer at all. The native cursor (cursors.css) stays the source of truth.
 */
export function CursorLayer() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reducedMotion = useReducedMotion();
  if (!finePointer) return null;
  return createPortal(<CursorFollower reducedMotion={reducedMotion} />, document.body);
}

/** Keeps the follower above modals and popovers: re-shows it (top of the top layer) whenever one opens. */
function keepOnTop(root: HTMLElement): () => void {
  if (typeof root.showPopover !== "function") return () => {};
  const raise = () => {
    if (!root.isConnected) return;
    if (root.matches(":popover-open")) root.hidePopover();
    root.showPopover();
  };
  raise();
  const dialogs = new MutationObserver((records) => {
    if (records.some((r) => r.target instanceof HTMLDialogElement && r.target.open)) raise();
  });
  dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  const onToggle = (e: Event) => {
    if (e.target !== root && (e as ToggleEvent).newState === "open") raise();
  };
  document.addEventListener("toggle", onToggle, true);
  return () => {
    dialogs.disconnect();
    document.removeEventListener("toggle", onToggle, true);
    if (root.matches(":popover-open")) root.hidePopover();
  };
}

function CursorFollower({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const lower = keepOnTop(root);
    const stop = startCursorEngine(root, { reducedMotion });
    return () => {
      stop();
      lower();
    };
  }, [reducedMotion]);

  return (
    <div ref={ref} className="cursor-fx" popover="manual" aria-hidden="true" data-mode="idle">
      <div className="cursor-fx__pos" data-fx-pos="">
        <span className="cursor-fx__beacon" data-fx-beacon="" />
        <span className="cursor-fx__radar" data-fx-radar="" />
        <span className="cursor-fx__radar" data-fx-radar="" />
        <span className="cursor-fx__radar" data-fx-radar="" />
        <div className="cursor-fx__bounce" data-fx-bounce="">
          <svg className="cursor-fx__ring" viewBox="-100 -100 200 200" width="200" height="200" focusable="false">
            <circle className="ring-fill" cx="0" cy="0" />
            <circle className="ring-ink" cx="0" cy="0" />
            <circle className="ring-white" cx="0" cy="0" />
            <path className="ring-slash" d="M-9 -9L9 9" />
          </svg>
        </div>
        <span className="cursor-fx__label" data-fx-label="" />
      </div>
    </div>
  );
}
