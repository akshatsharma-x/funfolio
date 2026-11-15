import Image from "next/image";
import type { ReactNode } from "react";
import { CURSOR_LABELS } from "@/components/cursor/skins";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { StickerCard } from "@/components/ui/StickerCard";
import { CursorControls } from "./CursorControls";
import { GameCanvasDemo } from "./GameCanvasDemo";

const BACKGROUNDS: { name: string; css: string }[] = [
  { name: "Black", css: "#000000" },
  { name: "White", css: "#FFFFFF" },
  { name: "#808080", css: "#808080" },
  { name: "Night bg", css: "#0E0B1E" },
  { name: "Day bg", css: "#FFF4E0" },
  { name: "Gold", css: "#FFC83D" },
  { name: "Cyan", css: "#22D3EE" },
  { name: "Lime", css: "#B6FF3B" },
  { name: "Violet", css: "#8B5CF6" },
  { name: "Pink", css: "#FF3D8B" },
  { name: "Yellow", css: "#FFD23F" },
  { name: "Orange", css: "#FF8A1F" },
  { name: "Mint", css: "#2EE59D" },
  { name: "Red", css: "#FF4D4D" },
  { name: "Checker", css: "repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 16px 16px" },
  { name: "Stripes", css: "linear-gradient(90deg, #FF3D8B 0 16%, #FF8A1F 0 33%, #FFD23F 0 50%, #B6FF3B 0 66%, #22D3EE 0 83%, #A78BFA 0)" },
];

function Zone({ cursor, label, title, children }: { cursor?: string; label?: string; title: string; children?: ReactNode }) {
  return (
    <div
      data-cursor={cursor}
      data-cursor-label={label}
      className="grid min-h-28 content-center gap-1 rounded-xl border-[3px] border-dashed border-line bg-surface-2 p-4 text-center"
    >
      <p className="font-pixel text-sm uppercase tracking-wider">{title}</p>
      {children ? <div className="text-sm text-muted">{children}</div> : null}
    </div>
  );
}

/** PART 2 test bench: every background, variant, label and locator feature in one place. */
export function CursorLab() {
  return (
    <section aria-labelledby="cursor-lab" className="shell grid gap-8 py-12">
      <div className="grid gap-3">
        <h2 id="cursor-lab" className="text-2xl">
          Cursor lab
        </h2>
        <p className="read text-muted">
          The pixel pointer is the native cursor (the truth layer: drawn by the OS, zero lag). The ring is a decoration
          on top. Try it: shake the mouse, hold still for 3s, press L, leave the window and come back.
        </p>
      </div>
      <CursorControls />

      <StickerCard as="section" aria-labelledby="cursor-bgs" bodyClassName="grid gap-5">
        <h3 id="cursor-bgs" className="text-lg">
          Visible on every background (hover each tile)
        </h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BACKGROUNDS.map((b) => (
            <li key={b.name} className="grid gap-1">
              <div className="h-20 rounded-lg border-2 border-ink" style={{ background: b.css }} />
              <span className="font-mono text-xs text-muted">{b.name}</span>
            </li>
          ))}
        </ul>
        <GameCanvasDemo />
      </StickerCard>

      <StickerCard as="section" aria-labelledby="cursor-variants" bodyClassName="grid gap-5">
        <h3 id="cursor-variants" className="text-lg">
          Variants &amp; follower states
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Zone cursor="grab" label="DRAG" title="Grab → grabbing">
            Press and hold: dashed spinning ring
          </Zone>
          <Zone cursor="pull" label="PULL!" title="Pull">
            Slingshot (PART 7)
          </Zone>
          <Zone cursor="crosshair" label="PLAY" title="Crosshair">
            Games
          </Zone>
          <Zone cursor="not-allowed" title="Not allowed">
            Red ring + slash
          </Zone>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#cursor-lab" data-cursor-label="OPEN" className="font-semibold underline">
            A link (hand + OPEN)
          </a>
          <ArcadeButton cursorLabel="LAUNCH" icon="star">
            Magnetic button
          </ArcadeButton>
          <ArcadeButton disabled icon="lock">
            Disabled
          </ArcadeButton>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Text field (native I-beam, ring fades)</span>
            <input type="text" className="rounded-lg border-2 border-ink bg-surface px-3 py-2 text-text" defaultValue="Type here" />
          </label>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Every follower label">
          {CURSOR_LABELS.map((l) => (
            <li key={l}>
              <span data-cursor="hand" data-cursor-label={l} className="chip">
                {l}
              </span>
            </li>
          ))}
        </ul>
      </StickerCard>

      <StickerCard as="section" aria-labelledby="cursor-proof" bodyClassName="grid gap-4">
        <h3 id="cursor-proof" className="text-lg">
          Proof sheet · every variant over hard backgrounds, then every skin
        </h3>
        <p className="read text-sm text-muted">
          Generated by <code className="font-mono">npm run cursors</code>. The 2px black + 2px white outline is what keeps
          each pointer visible on black, white, mid-gray, saturated colors, checkerboards and moving 3D.
        </p>
        <Image
          src="/cursors/proof.png"
          alt="Grid of the seven pixel cursors over sixteen backgrounds, followed by all six skins on gray"
          width={336}
          height={1104}
          className="h-auto w-full max-w-[336px] rounded-lg border-2 border-ink [image-rendering:pixelated]"
        />
      </StickerCard>
    </section>
  );
}
