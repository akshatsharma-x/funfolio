import type { NextConfig } from "next";

/**
 * Fully static export (Bible R10): no server, no API routes, no server actions,
 * no environment variables. `next build` writes the whole site to `out/`.
 *
 * - trailingSlash: every route exports as `route/index.html`, which every static
 *   host serves without rewrites (docs/DECISIONS.md).
 * - images.unoptimized: there is no image optimizer at runtime; AVIF/WebP
 *   variants are pre-built by `npm run images` (scripts/optimize-images.mjs).
 * - cacheComponents / partialPrefetching from the scaffold are intentionally
 *   absent: they target server streaming and need a Node.js runtime.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
