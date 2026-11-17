"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ByteScript } from "@/content/quips";
import { useSave } from "@/lib/store";
import { PixelFrame } from "@/components/ui/PixelFrame";
import { startByte } from "./brain";
import { FACE_COLS, FACE_ROWS } from "./faces";
import { ByteHatArt } from "./hats";

const INK = "var(--ink)";
const SHELL = "#FFF4E0";

/**
 * BYTE (PART 4): an original tiny floating robot with a rounded CRT-monitor head; the screen shows pixel eyes and moods
 * (face sheet in ./faces), the antenna bulb glows in --world. Rendered once into the end of <body> (so its two buttons
 * come last in Tab order); ./brain drives everything else. Hidden in Speedrun Mode and when turned off in Settings.
 */
export default function Byte({ script }: { script: ByteScript }) {
  const ref = useRef<HTMLDivElement>(null);
  const hat = useSave((s) => s.inventory.equipped.byteHat);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return startByte(root, script);
  }, [script]);

  // screen: x 11.5–52.5, y 18–44.5 → the 16×10 face grid at 2.5 units per pixel
  const scale = 40 / FACE_COLS;
  return createPortal(
    <div ref={ref} className="byte" data-byte="" data-mood="idle">
      <div className="byte__bubble" data-byte-bubble="" aria-hidden="true">
        <PixelFrame className="byte__frame" innerClassName="byte__frame-inner">
          <span className="byte__line">
            <span className="byte__ghost" data-byte-ghost="" />
            <span className="byte__typed" data-byte-text="" />
          </span>
        </PixelFrame>
      </div>

      <button type="button" className="byte__bot" data-byte-bot="" data-cursor="grab">
        <span className="byte__squash" data-byte-squash="">
          <span className="byte__float">
            <span className="byte__halo" aria-hidden="true" />
            <svg className="byte__svg" viewBox="0 0 64 72" width="64" height="72" aria-hidden="true" focusable="false">
              {/* PART 11: the hat from the Prize Counter (its back part sits behind the antenna and the head's top edge) */}
              {hat ? <ByteHatArt hat={hat} layer="back" /> : null}
              {/* antenna + bulb (its glow is the HTML halo below — compositor-only, so idle BYTE costs no paint) */}
              <line x1="32" y1="14" x2="32" y2="7" stroke={INK} strokeWidth="3" strokeLinecap="round" />
              <circle className="byte__bulb" cx="32" cy="5.5" r="4.2" fill="var(--world)" stroke={INK} strokeWidth="2" />
              {/* arms (behind the body) */}
              <g className="byte__arm byte__arm--l">
                <rect x="5" y="54" width="13" height="6.5" rx="3.25" fill={SHELL} stroke={INK} strokeWidth="2.5" />
              </g>
              <g className="byte__arm byte__arm--r">
                <rect x="46" y="54" width="13" height="6.5" rx="3.25" fill={SHELL} stroke={INK} strokeWidth="2.5" />
              </g>
              {/* neck + body */}
              <rect x="27" y="48" width="10" height="5" fill="#B9B2D9" stroke={INK} strokeWidth="2" />
              <rect x="17" y="52" width="30" height="14" rx="5" fill={SHELL} stroke={INK} strokeWidth="3" />
              <rect x="29" y="56" width="6" height="4.5" rx="1" fill="var(--world)" stroke={INK} strokeWidth="1.5" />
              {/* CRT head */}
              <rect x="6" y="13" width="52" height="36" rx="11" fill={SHELL} stroke={INK} strokeWidth="3" />
              <rect x="11.5" y="18" width="41" height="26.5" rx="6" fill="#07060F" />
              <g transform={`translate(12 19.25) scale(${scale})`}>
                <g data-byte-eyes="">
                  <path data-face="world" fill="var(--world)" d="" />
                  <path data-face="pink" fill="#FF3D8B" d="" />
                  <path data-face="white" fill="#FFFFFF" d="" />
                  {[0, 1, 2].map((i) => (
                    <rect key={i} className="byte__dot" data-byte-dot="" width="1" height="1" fill="var(--world)" style={{ display: "none", "--i": i } as CSSProperties} />
                  ))}
                </g>
                <rect width={FACE_COLS} height={FACE_ROWS} fill="none" />
              </g>
              <rect x="14.5" y="20.5" width="9" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.16" />
              {hat ? <ByteHatArt hat={hat} layer="front" /> : null}
            </svg>
          </span>
        </span>
        <span className="byte__shadow" aria-hidden="true" />
        <span className="byte__zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      </button>

      <button type="button" className="byte__min" data-byte-min="" aria-label="Minimize BYTE">
        <span aria-hidden="true">–</span>
      </button>
    </div>,
    document.body,
  );
}
