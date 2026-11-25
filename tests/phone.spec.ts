// Handheld Mode on a phone: the controller's ◀ ▶ hop between worlds, START opens the pause menu, A does each world's
// main thing (at the Launchpad: a shot — and the next one), and Ask BYTE opens as a sheet that B closes.
import { expect, test } from "@playwright/test";
import { open, seed, show, watch, world } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

test("the controller: ▶ ▶ ◀ move between worlds; START opens the pause menu (its Resume closes it)", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  const pad = (b: string) => page.locator(`[data-pad-btn="${b}"]`);
  await expect(pad("next")).toBeVisible();
  await pad("next").tap();
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("profile");
  await page.waitForTimeout(1800); // the pad's own flight holds it up for 1.5s
  await pad("next").tap();
  await expect.poll(() => world(page), { timeout: 10_000 }).not.toBe("profile");
  await page.waitForTimeout(1800);
  await pad("prev").tap();
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("profile");
  await page.waitForTimeout(1800);
  await pad("start").tap();
  const menu = page.locator("dialog[open]");
  await expect(menu).toBeVisible({ timeout: 5_000 });
  // a modal: the page behind it — the controller too — is inert, so the menu closes itself
  await menu.getByRole("button", { name: /^Resume/ }).first().tap();
  await expect(page.locator("dialog[open]")).toHaveCount(0, { timeout: 5_000 });
  expect(w.errors).toEqual([]);
});

test("A at the Launchpad fires a shot — and, once BYTE is back in the launcher, the next one", async ({ page }) => {
  const w = watch(page);
  await seed(page, { gates: [] });
  await open(page, "/#launchpad");
  await expect(page.locator(".lp[data-live]")).toBeVisible({ timeout: 30_000 });
  await show(page, ".lp__screen");
  const phase = () => page.evaluate(() => document.querySelector<HTMLElement>(".lp")?.dataset.phase ?? null);
  for (const left of [2, 1]) {
    await page.evaluate(() => window.scrollBy(0, -60)); // a small scroll up brings the tucked pad back
    await page.waitForTimeout(400);
    await page.locator('[data-pad-btn="a"]').tap();
    await expect.poll(phase, { timeout: 5_000 }).toBe("flying");
    await expect.poll(phase, { timeout: 25_000 }).toBe("aim");
    await expect(page.locator(".lp__shot[data-on]")).toHaveCount(left);
  }
  expect(w.errors).toEqual([]);
});

test("Ask BYTE on a phone: a sheet above the controller; B closes it", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.locator("[data-byte-ask]").tap();
  const chat = page.locator("[data-chat]");
  await expect(chat.locator("[data-chip]").first()).toBeVisible({ timeout: 8_000 });
  const sheet = (await chat.boundingBox())!;
  const pad = (await page.locator("[data-pad]").boundingBox())!;
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(pad.y + 1);
  await chat.locator("[data-chip]").first().tap();
  await expect(chat.locator(".chat__line--byte")).toHaveCount(2, { timeout: 5_000 });
  await page.locator('[data-pad-btn="b"]').dispatchEvent("pointerdown");
  await expect(chat).toHaveCount(0, { timeout: 5_000 });
  expect(w.errors).toEqual([]);
});
