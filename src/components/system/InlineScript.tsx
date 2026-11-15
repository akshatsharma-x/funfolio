"use client";

/**
 * Inline script that runs during HTML parsing (before first paint). Per the bundled Next.js guide
 * (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md): `text/javascript` on the
 * server, `text/plain` on the client, so React never re-runs it or warns about rendering a <script>.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
