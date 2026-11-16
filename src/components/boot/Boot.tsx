"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { BootScript } from "@/content/boot";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { startBoot, type BootController, type BootMode } from "./bootController";

const SEGMENTS = 12;
const DOTS = 120; // the log's dot leaders are cut to fit the line (CSS)

/**
 * AKSHAT-OS boot screen (PART 5): a native modal <dialog> over the server-rendered page — Esc / any key / "Skip ▶▶"
 * skip it, the page underneath is complete, and the cursor follower stays above it (R2/R3). Client-only and lazy;
 * never in Speedrun Mode or on deep links (see the pre-paint script). ./bootController runs the timeline.
 */
export default function Boot({ script, mode }: { script: BootScript; mode: BootMode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ctl = useRef<BootController | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const c = startBoot(root, script.lines, mode, script.coinTotal);
    ctl.current = c;
    return () => c.destroy();
  }, [script, mode]);

  return (
    <dialog ref={ref} className="boot" data-phase="power" aria-labelledby="boot-title" aria-describedby="boot-hint" tabIndex={-1}>
      <canvas className="boot__dissolve" data-boot-dissolve="" aria-hidden="true" />
      <div className="boot__crt" aria-hidden="true" />
      <div className="boot__screen">
        <p id="boot-title" className="boot__title">
          AKSHAT-OS <span className="boot__ver">v0.5</span>
        </p>
        <p id="boot-hint" className="sr-only">
          Starting the Funfolio. Press any key, or choose Skip, to go straight to the site.
        </p>

        <ol className="boot__log" aria-hidden="true">
          {script.lines.map((l, i) => (
            <li key={l.text} data-line={i}>
              <span className="boot__prompt">&gt;</span>
              <span className="boot__text" data-text="" data-full={l.text} />
              <span className="boot__dots">{".".repeat(DOTS)}</span>
              <span className="boot__ok">[{l.ok}]</span>
            </li>
          ))}
          <li className="boot__fast-line" data-fast-line="">
            <span className="boot__prompt">&gt;</span> SAVE FOUND · <span data-boot-save="" />
          </li>
        </ol>
        <div className="boot__bar" data-boot-bar="" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} data-seg="" style={{ "--i": i } as CSSProperties} />
          ))}
        </div>

        <div className="boot__coin-stage">
          <p className="boot__insert" aria-hidden="true">
            Insert coin
          </p>
          <div className="boot__coin-wrap" data-boot-coin-wrap="">
            <button type="button" className="boot__coin" data-boot-coin="" data-cursor="grab" aria-label="Insert coin (or drag it into the slot)">
              {/* the face glyphs are CSS-drawn: painted text would count as the button's visible label (WCAG 2.5.3) */}
              <span className="coin3d" aria-hidden="true">
                <span className="coin3d__face coin3d__face--front" />
                <span className="coin3d__face coin3d__face--back" />
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="coin3d__edge" style={{ "--i": i } as CSSProperties} />
                ))}
              </span>
            </button>
          </div>
          <div className="boot__slot" data-boot-slot="" aria-hidden="true">
            <span className="boot__slit" />
          </div>
          <p className="boot__credit" aria-live="polite">
            <span className="boot__credit-text">Credit 01</span>
          </p>
          <div className="boot__choice">
            <ArcadeButton icon="speaker" data-boot-start="sound" onClick={() => ctl.current?.start(true)}>
              ▶ Start with sound
            </ArcadeButton>
            <ArcadeButton variant="secondary" icon="mute" data-boot-start="muted" onClick={() => ctl.current?.start(false)}>
              Start muted
            </ArcadeButton>
          </div>
          <button type="button" className="boot__speedrun" onClick={() => ctl.current?.speedrun()}>
            Recruiter Speedrun <kbd className="kbd">Shift+R</kbd>
          </button>
        </div>

        <div className="boot__continue">
          <p className="boot__q">Continue?</p>
          <div className="boot__choice">
            <ArcadeButton icon="controller" data-boot-yes="" onClick={() => ctl.current?.continueYes()}>
              ▶ Yes
            </ArcadeButton>
            <ArcadeButton variant="secondary" data-boot-new="" onClick={() => ctl.current?.newGame()}>
              New game
            </ArcadeButton>
          </div>
          <div className="boot__confirm" role="group" aria-label="Confirm new game">
            <p>Start over? This erases your save like a corrupted memory card.</p>
            <div className="boot__choice">
              <ArcadeButton variant="danger" data-boot-erase="" onClick={() => ctl.current?.erase()}>
                Erase &amp; start
              </ArcadeButton>
              <ArcadeButton variant="ghost" data-boot-back="" onClick={() => ctl.current?.back()}>
                Back
              </ArcadeButton>
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="boot__skip" data-boot-skip="" onClick={() => ctl.current?.skip()}>
        Skip <span aria-hidden="true">▶▶</span>
      </button>
    </dialog>
  );
}
