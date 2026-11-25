import { defineConfig } from "@playwright/test";

/**
 * The smoke test (PART 18): `npm run build`, then `npm run test:smoke`. It serves the static export (`out/`) the way a
 * static host does (scripts/serve-out.mjs) and runs in the installed Google Chrome — no browser download. On a machine
 * without Chrome, run `npx playwright install chromium` and delete the `channel` line.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0, // games and physics run in real time; a slow CI runner gets one more go
  reporter: [["list"]],
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "node scripts/serve-out.mjs 4173",
    url: "http://localhost:4173/",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
