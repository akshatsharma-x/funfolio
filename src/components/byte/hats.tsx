// BYTE's hats (PART 11 Prize Counter): original art in BYTE's own 64×72 SVG coordinates (the CRT head spans x 6–58,
// y 13–49; the antenna bulb sits at 32, 5.5). "back" parts draw before the antenna and head, so the head's top edge
// tucks the hat in and the bulb stays in front; "front" parts (the headphone cups) draw over the head's sides.

import type { ByteHat } from "@/content/prizes";

const INK = "var(--ink)";

export function ByteHatArt({ hat, layer }: { hat: ByteHat; layer: "back" | "front" }) {
  if (hat === "party") {
    return layer === "back" ? (
      <g className="byte__hat" data-hat="party">
        <polygon points="9,16 27,13 13,-9" fill="#FF3D8B" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M12.4 5 L21.5 3.6 M10.6 10.4 L24.6 8.2" stroke="#FFD23F" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="13" cy="-10" r="3.4" fill="#FFD23F" stroke={INK} strokeWidth="2" />
      </g>
    ) : null;
  }
  if (hat === "crown") {
    return layer === "back" ? (
      <g className="byte__hat" data-hat="crown">
        <polygon points="16,15 16,3 24,9 32,-1 40,9 48,3 48,15" fill="#FFC83D" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="24" cy="11.4" r="1.9" fill="#FF3D8B" stroke={INK} strokeWidth="1" />
        <circle cx="40" cy="11.4" r="1.9" fill="#22D3EE" stroke={INK} strokeWidth="1" />
        <path d="M18.5 13.2 H45.5" stroke="#FFF1A8" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    ) : null;
  }
  if (hat === "wizard") {
    return layer === "back" ? (
      <g className="byte__hat" data-hat="wizard">
        <polygon points="36,15 58,13 52,-17" fill="#8B5CF6" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M48 -4 l1.2 2.4 2.6 .3 -1.9 1.8 .5 2.6 -2.4 -1.3 -2.4 1.3 .5 -2.6 -1.9 -1.8 2.6 -.3z" fill="#FFD23F" />
        <circle cx="44" cy="7" r="1.3" fill="#FFF4E0" />
        <ellipse cx="47" cy="14.6" rx="14" ry="3.2" fill="#A78BFA" stroke={INK} strokeWidth="2" />
      </g>
    ) : null;
  }
  // headphones: the band over the head (behind the antenna), the cups over the head's sides
  return layer === "back" ? (
    <g className="byte__hat" data-hat="headphones">
      <path d="M7 30 C 5 1, 59 1, 57 30" fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M7 30 C 5 1, 59 1, 57 30" fill="none" stroke="#22D3EE" strokeWidth="2.8" strokeLinecap="round" />
    </g>
  ) : (
    <g className="byte__hat" data-hat="headphones">
      <rect x="0.5" y="21" width="9" height="17" rx="3.5" fill="#FF3D8B" stroke={INK} strokeWidth="2.2" />
      <rect x="54.5" y="21" width="9" height="17" rx="3.5" fill="#FF3D8B" stroke={INK} strokeWidth="2.2" />
    </g>
  );
}

/** A small framed preview of a hat on BYTE's head outline (Prize Counter cards). */
export function ByteHatPreview({ hat }: { hat: ByteHat }) {
  return (
    <svg viewBox="-2 -20 68 54" width="64" height="51" aria-hidden="true" focusable="false" className="hat-preview">
      <ByteHatArt hat={hat} layer="back" />
      <line x1="32" y1="14" x2="32" y2="7" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5.5" r="4.2" fill="#FFC83D" stroke={INK} strokeWidth="2" />
      <rect x="6" y="13" width="52" height="20" rx="9" fill="#E4E1EC" stroke={INK} strokeWidth="3" />
      <rect x="11.5" y="18" width="41" height="13" rx="5" fill="#07060F" />
      <rect x="20" y="22" width="5" height="5" fill="#22D3EE" />
      <rect x="39" y="22" width="5" height="5" fill="#22D3EE" />
      <ByteHatArt hat={hat} layer="front" />
    </svg>
  );
}
