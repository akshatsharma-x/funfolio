// Shared helpers for the Playwright suites (tests/*.spec.ts): seed a save, open a page with the boot skipped, watch
// for console errors and third-party requests, read the save, scroll something into view.
import { expect, type Page } from "@playwright/test";

export type Watch = { errors: string[]; foreign: string[] };

/** Console errors, uncaught errors and every request that leaves the site. */
export function watch(page: Page): Watch {
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/Failed to load resource: the server responded with a status of 404/.test(m.text())) return; // the 404 page itself
    errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith("http") && !["localhost", "127.0.0.1"].includes(url.hostname)) foreign.push(r.url());
  });
  return { errors, foreign };
}

/** A returning player (the Quest Log's gate open unless the state says otherwise). Seeds the first load only. */
export async function seed(page: Page, state: Record<string, unknown> = {}) {
  const value = JSON.stringify({ state: { gates: ["quest-log"], achievements: { "player-one": Date.now() - 900_000 }, ...state }, version: 4 });
  await page.addInitScript((v) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.setItem("funfolio-save", v);
  }, value);
}

/** Opens a page with the boot skipped and waits for the game layer (the HUD is part of the lazy runtime). */
export async function open(page: Page, path = "/") {
  const url = new URL(path, "http://x");
  url.searchParams.set("boot", "0");
  await page.goto(`${url.pathname}${url.search}${url.hash}`);
  await expect(page.locator("header.hud")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800); // BYTE, the warm-up and the hash jump settle
}

/** The save as stored in this browser. */
export const save = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("funfolio-save") ?? "{}").state ?? {});

/** Hidden coins found so far. */
export const coins = async (page: Page): Promise<string[]> => (await save(page)).player?.coinIds ?? [];

/** Scrolls an element to the middle of the screen at once and lets the page settle. */
export async function show(page: Page, selector: string) {
  await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);
}

/** The world the HUD says the visitor is in. */
export const world = (page: Page) => page.evaluate(() => document.documentElement.dataset.world ?? null);
