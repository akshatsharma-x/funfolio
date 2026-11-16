import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Pixelify_Sans, Unbounded } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./cursors.generated.css";
import "./cursors.css";
import "./game.css";
import "./fx.css";
import "./title.css";
import "./profile.css";
import "./launchpad.css";
import "./quests.css";
import "./boot.css";
import { CursorLayer } from "@/components/cursor/CursorLayer";
import { GameRuntimeLoader } from "@/components/hud/GameRuntimeLoader";
import { InlineScript } from "@/components/system/InlineScript";
import { SmoothScroll } from "@/components/system/SmoothScroll";
import { player } from "@/content/content";
import { buildBootScript } from "@/content/boot";
import { buildByteScript } from "@/content/quips";
import { site, siteUrl } from "@/content/site";
import { publicFileExists } from "@/lib/files";
import { PREPAINT_SCRIPT } from "@/lib/prefs";

// next/font downloads these at build time and self-hosts them under /_next/static/media — no runtime font requests (R10).
const display = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify", display: "swap" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s · ${player.handle}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: player.name }],
  creator: player.name,
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: { type: "website", siteName: site.name, title: site.title, description: site.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0e0b1e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${pixel.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        {/* Sets data-theme/fx/mode/cursor(-skin/-size)/world on <html> before first paint (docs/DECISIONS.md #5). */}
        <InlineScript html={PREPAINT_SCRIPT} />
      </head>
      <body>
        {/* PART 5: black boot curtain from the first paint (html[data-boot]) until the boot screen takes over; it
            hides itself after a few seconds if JavaScript never arrives (R3) */}
        <div className="boot-curtain" aria-hidden="true" />
        <a href="#main" className="arcade-btn skip-link" data-size="sm">
          Skip to content
        </a>
        <SmoothScroll />
        {/* HUD, pause menu, toasts, shortcuts, world tracking — lazy, client-only (PART 3). Before the content in the
            DOM, so Tab order matches the screen (skip link → HUD → main); the skip link bypasses it. */}
        <GameRuntimeLoader
          resumeHref={publicFileExists(player.resumeUrl) ? player.resumeUrl : null}
          byteScript={buildByteScript()}
          bootScript={buildBootScript()}
        />
        {children}
        <CursorLayer />
      </body>
    </html>
  );
}
