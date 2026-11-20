// Smoke test (PART 18): the static export loads with no console errors, Speedrun Mode shows every fact, every world id
// exists, the contact form validates and builds the right mailto: link, the 404 renders, and nothing is requested from
// anywhere but the site itself. Run `npm run build` first, then `npm run test:smoke`.
import { expect, test, type Page } from "@playwright/test";
import { education, experience, honors, player, projects, research } from "../src/content/content";
import { mailtoHref, QUEST_TYPES } from "../src/lib/invite";

const WORLDS = ["title", "profile", "launchpad", "quests", "lab", "vault", "arcade", "skills", "trophies", "lobby", "credits"];

/** Console errors, uncaught errors and every request that leaves the site. */
function watch(page: Page) {
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/Failed to load resource: the server responded with a status of 404/.test(m.text())) return; // the 404 page's own document
    errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith("http") && !["localhost", "127.0.0.1"].includes(url.hostname)) foreign.push(r.url());
  });
  return { errors, foreign };
}

// a returning player who has opened the Quest Log's gate: no boot screen, no gate frost
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE = { mailto: [] };
    if (sessionStorage.getItem("smoke")) return;
    sessionStorage.setItem("smoke", "1");
    localStorage.setItem("funfolio-save", JSON.stringify({ state: { gates: ["quest-log"] }, version: 3 }));
  });
});

test("the home page loads with no console errors, every world id exists, nothing leaves the site", async ({ page }) => {
  const w = watch(page);
  await page.goto("/?boot=0");
  await expect(page.locator("header.hud")).toBeVisible({ timeout: 30_000 });
  for (const id of WORLDS) await expect(page.locator(`#${id}`), `world #${id}`).toHaveCount(1);
  // scroll through every world so the lazy parts (3D, games' hosts, portals) load too
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1500);
  expect(w.errors, "console errors").toEqual([]);
  expect(w.foreign, "third-party requests").toEqual([]);
});

test("Speedrun Mode shows all the content", async ({ page }) => {
  const w = watch(page);
  await page.goto("/?speedrun");
  await expect(page.locator(".speedrun-summary")).toBeVisible();
  // every fact a recruiter needs is on screen (innerText: what's visible; case-folded — CSS uppercases some titles)
  const text = (await page.locator("body").innerText()).toLowerCase().replace(/\s+/g, " ");
  const facts = [
    player.name,
    player.status,
    education.school,
    education.degree,
    education.cgpa,
    ...experience.flatMap((e) => [e.company, e.role, e.period]),
    ...projects.map((p) => p.title),
    ...research.map((r) => r.title),
    ...honors.map((h) => h.title),
  ];
  const missing = facts.filter((f) => !text.includes(f.toLowerCase().replace(/\s+/g, " ")));
  expect(missing, "facts not visible in Speedrun Mode").toEqual([]);
  expect(w.errors).toEqual([]);
  expect(w.foreign).toEqual([]);
});

test("the contact form validates and builds the right mailto: link", async ({ page }) => {
  const w = watch(page);
  await page.goto("/?boot=0#lobby");
  await expect(page.locator("#invite-name")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  // empty → an in-character error on every field, nothing sent
  await page.click("[data-invite-send]");
  await expect(page.locator("#invite-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#invite-msg")).toHaveAttribute("aria-invalid", "true");
  expect(await page.evaluate(() => (window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE.mailto)).toEqual([]);
  // valid → fold, fly (Enter on the plane), mailto
  const invite = { name: "Ada & Co", quest: QUEST_TYPES[1], message: "Hi Akshat — want to team up? 100% serious." };
  await page.fill("#invite-name", invite.name);
  await page.locator(".quest-chip input").nth(1).check({ force: true });
  await page.fill("#invite-msg", invite.message);
  await page.click("[data-invite-send]");
  await expect(page.locator("[data-plane]")).toBeFocused({ timeout: 6000 });
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE.mailto), { timeout: 10_000 }).toEqual([mailtoHref(player.email, invite)]);
  expect(w.errors).toEqual([]);
  expect(w.foreign).toEqual([]);
});

test("an unknown address renders GAME OVER with status 404", async ({ page }) => {
  const w = watch(page);
  const res = await page.goto("/no-such-level/");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/game over/i);
  await expect(page.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/");
  expect(w.errors).toEqual([]);
  expect(w.foreign).toEqual([]);
});
