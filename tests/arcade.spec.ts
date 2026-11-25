// The Arcade: every cabinet opens its game; each game starts, answers real input, pauses, restarts into a second round
// that works too, and exits. Token Squeeze goes all the way to its results and plays again. Live game state is read
// through the opt-in `window.__QA_ARCADE` hook (DECISIONS #134).
import { expect, test, type Page } from "@playwright/test";
import { open, seed, show, watch } from "./helpers";

type Qa = Record<string, Record<string, unknown>>;
const shell = (page: Page) => page.locator(".gshell");
const timeLeft = async (page: Page) => Number((await page.locator(".gshell__readout", { hasText: "Time" }).locator("b").textContent())?.replace(/\D/g, "") || NaN);

/** One real input per game, and proof the game took it. */
const PLAY: Record<string, (page: Page) => Promise<void>> = {
  "token-squeeze": async (page) => {
    await page.locator(".ts-prompt button").first().click();
    await expect(page.locator(".ts-prompt button[data-gone], .ts-prompt button[data-shake]")).not.toHaveCount(0);
  },
  "cache-hit": async (page) => {
    await page.locator(".ch-grid button").nth(0).click();
    await expect(page.locator(".ch-grid button[data-up]")).not.toHaveCount(0);
  },
  "bug-whack": async (page) => {
    // whack bugs as they pop out until one lands (a bug lives ≥ 650ms)
    await expect
      .poll(
        async () => {
          const bug = page.locator('.bw [data-kind="bug"]').first();
          if (await bug.count()) await bug.click({ timeout: 500 }).catch(() => {});
          return Number((await page.locator(".gshell__readout", { hasText: "Score" }).locator("b").textContent())?.replace(/\D/g, "") || 0);
        },
        { timeout: 20_000, intervals: [150] },
      )
      .toBeGreaterThan(0);
  },
  "rag-catcher": async (page) => {
    const x0 = await page.evaluate(() => ((window as unknown as { __QA_ARCADE: Qa }).__QA_ARCADE["rag-catcher"]?.bx as number) ?? NaN);
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(500);
    await page.keyboard.up("ArrowLeft");
    const x1 = await page.evaluate(() => ((window as unknown as { __QA_ARCADE: Qa }).__QA_ARCADE["rag-catcher"]?.bx as number) ?? NaN);
    expect(x1, "the retriever moved left").toBeLessThan(x0);
  },
  pipeline: async (page) => {
    const dir = () => page.evaluate(() => JSON.stringify((window as unknown as { __QA_ARCADE: Qa }).__QA_ARCADE.pipeline?.dir ?? null));
    const d0 = await dir();
    await page.keyboard.press("ArrowUp");
    await expect.poll(dir, { timeout: 3_000 }).not.toBe(d0);
  },
  "gradient-descent": async (page) => {
    const v = () => page.evaluate(() => { const g = (window as unknown as { __QA_ARCADE: Qa }).__QA_ARCADE["gradient-descent"]?.st as { v: { x: number; y: number } } | undefined; return g ? Math.hypot(g.v.x, g.v.y) : NaN; });
    await page.keyboard.down("ArrowLeft");
    await expect.poll(v, { timeout: 3_000 }).toBeGreaterThan(0);
    await page.keyboard.up("ArrowLeft");
  },
};

/** Playing, with focus handed to the game (the shell does that on every start, so keys work at once). */
async function playing(page: Page) {
  await expect(shell(page)).toHaveAttribute("data-phase", "playing");
  await expect(page.locator(".gshell [data-game-focus]").first()).toBeFocused({ timeout: 5_000 });
}

async function openGame(page: Page, id: string) {
  await page.addInitScript(() => ((window as unknown as { __QA_ARCADE: Qa }).__QA_ARCADE = {}));
  await seed(page);
  await open(page, "/#arcade");
  await show(page, `[data-play-game="${id}"]`);
  await page.locator(`[data-play-game="${id}"]`).click();
  await expect(shell(page)).toHaveAttribute("data-phase", "title", { timeout: 15_000 });
  await expect(page.locator("[data-shell-start]")).toBeFocused();
}

for (const id of Object.keys(PLAY)) {
  test(`${id}: plays, pauses, restarts into a working second round, exits`, async ({ page }) => {
    const w = watch(page);
    await openGame(page, id);
    await expect(shell(page)).toHaveAttribute("data-game", id);
    await page.locator("[data-shell-start]").click();
    await playing(page);
    const t0 = await timeLeft(page);
    await PLAY[id](page);
    await expect.poll(() => timeLeft(page), { timeout: 5_000 }).toBeLessThan(t0); // the clock runs
    // pause (P), restart: a fresh round that takes input again
    await page.locator("[data-game-focus]").first().focus();
    await page.keyboard.press("p");
    await expect(shell(page)).toHaveAttribute("data-phase", "paused");
    await expect(page.locator("[data-shell-resume]")).toBeFocused();
    await page.getByRole("button", { name: /^Restart/ }).click();
    await playing(page);
    await PLAY[id](page);
    // Esc pauses first, Exit closes the game and its dialog
    await page.keyboard.press("Escape");
    await expect(shell(page)).toHaveAttribute("data-phase", "paused");
    await page.getByRole("button", { name: /^Exit/ }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    expect(w.errors).toEqual([]);
    expect(w.foreign).toEqual([]);
  });
}

test("Token Squeeze all the way: squeeze everything → results → Play again → a fresh round", async ({ page }) => {
  const w = watch(page);
  await openGame(page, "token-squeeze");
  for (let round = 1; round <= 2; round++) {
    await page.locator(round === 1 ? "[data-shell-start]" : "[data-shell-again]").click();
    await playing(page);
    // squeeze every tile: the filler collapses, the words that matter shake and stay — the round ends when the filler's gone
    const tiles = page.locator(".ts-prompt button");
    const n = await tiles.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n && (await shell(page).getAttribute("data-phase")) === "playing"; i++) {
      const t = tiles.nth(i);
      if ((await t.getAttribute("data-gone")) === null) await t.click({ timeout: 2_000 }).catch(() => {});
    }
    await expect(shell(page)).toHaveAttribute("data-phase", "results", { timeout: 10_000 });
    await expect(page.locator("[data-shell-again]")).toBeFocused();
  }
  await page.getByRole("button", { name: /^Exit/ }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect(w.errors).toEqual([]);
});
