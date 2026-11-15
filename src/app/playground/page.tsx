import type { Metadata } from "next";
import Link from "next/link";
import { CursorLab } from "@/components/playground/CursorLab";
import { KitShowcase } from "@/components/playground/KitShowcase";
import { PlaygroundControls } from "@/components/playground/PlaygroundControls";
import { StyleTile } from "@/components/playground/StyleTile";
import { THEMES, type Theme } from "@/lib/prefs";

// noindex via meta tag — never a robots.txt Disallow (docs/DECISIONS.md #15).
export const metadata: Metadata = {
  title: "Playground",
  robots: { index: false, follow: false },
};

const THEME_LABEL: Record<Theme, string> = {
  night: "Night · Neon Arcade",
  day: "Day · Toybox",
  retro: "Retro · CRT",
};

/** Dev page: every UI-kit component in all 3 themes + the style tile, to lock the look before building worlds. */
export default function PlaygroundPage() {
  return (
    <main id="main" className="pb-10">
      <header className="shell grid gap-6 py-12">
        <p className="font-pixel text-sm uppercase tracking-[0.14em] text-muted">Dev page · not indexed</p>
        <h1 className="text-2xl">Playground · UI kit &amp; style tile</h1>
        <p className="read text-muted">
          Every component in all three themes, so the look is locked before the worlds are built. Contrast ratios are
          measured from the rendered colors. <Link href="/">Back to the site</Link>.
        </p>
        <PlaygroundControls />
      </header>
      <StyleTile />
      <CursorLab />
      {THEMES.map((t) => (
        <section key={t} data-theme={t} aria-labelledby={`panel-${t}`} className="py-14">
          <div className="shell">
            <h2 id={`panel-${t}`} className="mb-10 text-2xl">
              {THEME_LABEL[t]}
            </h2>
            <KitShowcase theme={t} />
          </div>
        </section>
      ))}
    </main>
  );
}
