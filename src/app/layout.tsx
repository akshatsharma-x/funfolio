import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Pixelify_Sans, Unbounded } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { InlineScript } from "@/components/system/InlineScript";
import { SmoothScroll } from "@/components/system/SmoothScroll";
import { player } from "@/content/content";
import { site, siteUrl } from "@/content/site";
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
        {/* Sets data-theme/fx/mode/cursor/world on <html> before first paint (docs/DECISIONS.md #5). */}
        <InlineScript html={PREPAINT_SCRIPT} />
      </head>
      <body>
        <a href="#main" className="arcade-btn skip-link" data-size="sm">
          Skip to content
        </a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
