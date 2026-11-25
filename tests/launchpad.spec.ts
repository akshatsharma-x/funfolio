// The Launchpad slingshot, played the way visitors play it: a real pointer pull for every shot (the grab handle used to
// stay hidden after the first one — the stage only refreshed its phase on some events), a finger on a phone, the
// keyboard, Play again, Reset and Skip.
import { expect, test, type Page } from "@playwright/test";
import { open, seed, show, watch } from "./helpers";

const phase = (page: Page) => page.evaluate(() => document.querySelector<HTMLElement>(".lp")?.dataset.phase ?? null);
const shotsLeft = (page: Page) => page.locator(".lp__shot[data-on]").count();

/** Where the grab handle is (it only exists while BYTE waits in the launcher). */
async function handleCenter(page: Page) {
  const handle = page.locator(".lp__handle");
  await expect(handle, "BYTE can be grabbed for the next shot").toBeVisible({ timeout: 20_000 });
  const box = (await handle.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The shot is over once BYTE waits in the launcher again — or the round has ended. */
async function afterShot(page: Page) {
  await expect.poll(() => phase(page), { timeout: 5_000 }).toBe("flying");
  await expect.poll(() => phase(page), { timeout: 25_000 }).toMatch(/^(aim|over)$/);
}

/** A mouse pull: down on BYTE, back and down along the pull, release. */
async function mouseShot(page: Page) {
  const { x, y } = await handleCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 12, y + i * 9);
  await page.mouse.up();
  await afterShot(page);
}

async function ready(page: Page, path = "/#launchpad") {
  await seed(page, { gates: [] });
  await open(page, path);
  await expect(page.locator(".lp[data-live]")).toBeVisible({ timeout: 30_000 });
  await show(page, ".lp__screen");
}

test("three shots with the mouse, then Play again — BYTE can be grabbed for every shot", async ({ page }) => {
  const w = watch(page);
  await ready(page);
  for (const left of [2, 1, 0]) {
    await mouseShot(page);
    expect(await shotsLeft(page)).toBe(left);
  }
  await expect(page.locator(".lp__result")).toBeVisible();
  expect(await phase(page)).toBe("over");
  await page.locator(".lp__result").getByRole("button", { name: /Play again/ }).click();
  await expect.poll(() => phase(page)).toBe("aim");
  expect(await shotsLeft(page)).toBe(3);
  await mouseShot(page); // the new round's first shot
  expect(await shotsLeft(page)).toBe(2);
  await mouseShot(page);
  expect(await shotsLeft(page)).toBe(1);
  expect(w.errors).toEqual([]);
});

test("a finger pull on a phone fires every shot too", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const w = watch(page);
  await ready(page);
  const cdp = await ctx.newCDPSession(page);
  for (const left of [2, 1]) {
    const { x, y } = await handleCenter(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 7, y: y + i * 5 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await afterShot(page);
    expect(await shotsLeft(page)).toBe(left);
  }
  expect(w.errors).toEqual([]);
  await ctx.close();
});

test("the keyboard: ↑ pulls, Space launches, the next shot is ready, R resets", async ({ page }) => {
  const w = watch(page);
  await ready(page);
  await page.locator(".lp__screen").focus();
  for (const left of [2, 1]) {
    await page.keyboard.press("ArrowUp"); // the first arrow sets a 70% pull
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Space");
    await afterShot(page);
    expect(await shotsLeft(page)).toBe(left);
  }
  await page.keyboard.press("r");
  await expect.poll(() => shotsLeft(page)).toBe(3);
  expect(await phase(page)).toBe("aim");
  // and the mouse still works after a keyboard round
  await mouseShot(page);
  expect(await shotsLeft(page)).toBe(2);
  expect(w.errors).toEqual([]);
});

test("Reset ↺ mid-round brings back all three shots; Skip ▶▶ opens the Quest Log", async ({ page }) => {
  const w = watch(page);
  await ready(page);
  await mouseShot(page);
  await page.getByRole("button", { name: /Reset/ }).click();
  await expect.poll(() => shotsLeft(page)).toBe(3);
  await mouseShot(page);
  expect(await shotsLeft(page)).toBe(2);
  expect(await page.evaluate(() => document.documentElement.dataset.questLog)).toBe("locked");
  await page.getByRole("button", { name: /Skip/ }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.questLog), { timeout: 10_000 }).toBe("open");
  expect(w.errors).toEqual([]);
});
