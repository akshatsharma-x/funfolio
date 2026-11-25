// Every world's toys, used like a visitor uses them — and the replayable ones used twice: the Title's landmarks and
// coin, the Profile's avatar / perks / crate, the Quest Log's coin, loot chip and side quest, the Lab's scrolls and
// purifier, the Vault's cartridges, filter, locked cartridge and page scan, the Prize Counter, the Skill Tree's tree /
// inventory / JD scanner, the Trophy Room's pedestals and capsule machine, the Co-op Lobby's invite and the credits.
import { expect, test } from "@playwright/test";
import { coins, open, save, seed, show, watch, world } from "./helpers";

test("Title Screen: Peek behind the tower reveals coin #2; a landmark flies to its world", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.getByRole("button", { name: /^Peek behind the tower/ }).click();
  const coin = page.locator('[data-coin-id="quest-tower"]');
  await expect(coin).toBeVisible({ timeout: 8_000 });
  await coin.click();
  await expect.poll(() => coins(page)).toContain("quest-tower");
  await page.getByRole("button", { name: /^Player House/ }).click();
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("profile");
  expect(w.errors).toEqual([]);
});

test("Player Profile: a high-five from BYTE, a perk flipped both ways, the mystery crate (coin #4)", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#profile");
  await show(page, ".avatar-btn");
  await page.locator(".avatar-btn").click();
  await expect(page.locator(".byte__bubble[data-open]")).toBeVisible({ timeout: 5_000 });
  const perk = page.locator("button.perk").first();
  await show(page, "button.perk");
  await perk.click();
  await expect(perk).toHaveAttribute("aria-pressed", "true");
  await perk.click();
  await expect(perk).toHaveAttribute("aria-pressed", "false");
  await show(page, ".crate__btn");
  for (let i = 0; i < 3; i++) {
    await page.locator(".crate__btn").click();
    await page.waitForTimeout(350);
  }
  await expect.poll(() => coins(page), { timeout: 5_000 }).toContain("mystery-crate");
  expect(w.errors).toEqual([]);
});

test("Quest Log: the $0.08 coin (#6), the side quest's game, a loot chip that lands on its skill", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#quests");
  await show(page, ".coin-egg");
  await page.locator(".coin-egg").click();
  await expect.poll(() => coins(page)).toContain("active-quest");
  await show(page, "text=Side quest: Token Squeeze");
  await page.getByRole("button", { name: /^Side quest: Token Squeeze/ }).click();
  await expect(page.locator('.gshell[data-game="token-squeeze"]')).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0, { timeout: 5_000 });
  const chip = page.locator('#quests a.chip[href="#skill-langgraph"]').first();
  await chip.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await chip.click();
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("#skill-langgraph")), { timeout: 10_000 }).toBe(true);
  expect(await world(page)).toBe("skills");
  expect(w.errors).toEqual([]);
});

test("The Lab: each scroll opens and closes — twice; the air purifier clears the smog (coin #7)", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#lab");
  for (const id of ["cold-chain", "pm25", "cold-chain", "pm25"]) {
    await show(page, `[data-scroll-open="${id}"]`);
    await page.locator(`[data-scroll-open="${id}"]`).click();
    await expect(page.locator("dialog.scroll-modal[open]")).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0, { timeout: 5_000 });
  }
  await show(page, "[data-purify]");
  await page.locator("[data-purify]").click();
  await expect.poll(() => coins(page), { timeout: 20_000 }).toContain("cleared-smog");
  expect(w.errors).toEqual([]);
});

test("Cartridge Vault: insert, eject, insert another; the filter; the locked cartridge (coin #8); the analyzer's page scan", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#vault");
  const funsole = page.locator("[data-funsole]");
  for (const id of ["cognivault", "quizmuj", "cognivault"]) {
    await show(page, `[data-cart-btn="${id}"]`);
    await page.locator(`[data-cart-btn="${id}"]`).click();
    await expect(funsole).toHaveAttribute("data-cart", id, { timeout: 8_000 });
    await expect(funsole).toHaveAttribute("data-phase", "details", { timeout: 10_000 });
    await page.locator("[data-eject]").click();
    await expect(funsole).toHaveAttribute("data-phase", "idle", { timeout: 8_000 });
  }
  await show(page, '[data-filter-tab="ai"]');
  await page.locator('[data-filter-tab="ai"]').click();
  await expect(page.locator(".vault")).toHaveAttribute("data-filter", "ai");
  await page.locator('[data-filter-tab="all"]').click();
  await expect(page.locator(".vault")).toHaveAttribute("data-filter", "all");
  await show(page, "[data-cart-locked]");
  for (let i = 0; i < 5; i++) {
    await page.locator("[data-cart-locked]").click();
    await page.waitForTimeout(250);
  }
  await expect.poll(() => coins(page), { timeout: 5_000 }).toContain("locked-cartridge");
  // "Scan this page" is the Web Accessibility Analyzer's side quest: on its screen once that cartridge is in
  await show(page, '[data-cart-btn="a11y-analyzer"]');
  await page.locator('[data-cart-btn="a11y-analyzer"]').click();
  await expect(funsole).toHaveAttribute("data-phase", "details", { timeout: 10_000 });
  await page.locator("[data-scan]").click();
  await expect(page.locator("[data-scan-results]")).toContainText("Scan complete", { timeout: 30_000 });
  expect(w.errors).toEqual([]);
});

test("Prize Counter: buy a cursor with wallet coins and equip it", async ({ page }) => {
  const w = watch(page);
  await seed(page, { player: { xp: 0, level: 1, wallet: 50, coinIds: [], xpClaims: [] } });
  await open(page, "/#arcade");
  const buy = page.locator(".prize__btn", { hasText: /^Buy/ }).first();
  await buy.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const wallet0 = (await save(page)).player.wallet as number;
  await buy.click();
  await expect.poll(async () => (await save(page)).player.wallet as number).toBeLessThan(wallet0);
  const equip = page.locator(".prize__btn", { hasText: /^Equip / }).first();
  await expect(equip).toBeVisible({ timeout: 5_000 });
  const skin0 = await page.evaluate(() => document.documentElement.dataset.cursorSkin);
  await equip.click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.cursorSkin)).not.toBe(skin0);
  expect(w.errors).toEqual([]);
});

test("Skill Tree: a node's card; the root knocked twice (coin #10); inventory search + loadout; the JD scanner twice", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#skills");
  const node = page.locator("#skill-python .sk-node__btn");
  await node.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await node.click();
  await expect(page.locator("#skill-python .sk-card")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  const root = page.locator("[data-sk-root]").first();
  await root.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await root.click();
  await root.click();
  await expect.poll(() => coins(page), { timeout: 5_000 }).toContain("skill-root");
  // inventory: search "js", equip three items
  await page.locator("#skills-tab-inventory").click();
  await expect(page.locator("#skills-inventory")).toBeVisible();
  await page.fill("#inv-q", "js");
  await expect(page.locator(".inv-slot[data-hit]")).not.toHaveCount(0);
  await page.fill("#inv-q", "");
  const slots = page.locator(".inv-slot__btn");
  for (let i = 0; i < 3; i++) await slots.nth(i).click();
  await expect(page.locator("[data-loadout-slot] .inv-slot__btn, [data-loadout-slot] button").first()).toBeVisible();
  // the JD scanner, twice
  await page.locator("#skills-tab-jd").click();
  await expect(page.locator("#skills-jd")).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await page.locator("[data-jd-sample]").click();
    await page.locator("[data-jd-scan]").click();
    await expect(page.locator("[data-jd-results]")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("[data-jd-results]")).toContainText(/matching skill/i);
  }
  expect(w.errors).toEqual([]);
});

test("Trophy Room: two honors open and close; the capsule machine deals twice", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#trophies");
  const halls = page.locator("[data-hall-btn]");
  for (const i of [0, 1, 0]) {
    await halls.nth(i).evaluate((el) => el.scrollIntoView({ block: "center" }));
    await halls.nth(i).click();
    await expect(halls.nth(i)).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
    await page.keyboard.press("Escape");
    await expect(halls.nth(i)).toHaveAttribute("aria-expanded", "false", { timeout: 5_000 });
  }
  const turn = page.locator("[data-capsule-turn]");
  await turn.evaluate((el) => el.scrollIntoView({ block: "center" }));
  for (let i = 0; i < 2; i++) {
    await expect(turn).toBeEnabled({ timeout: 10_000 });
    await turn.click();
    await expect(page.locator("[data-capsule-prize]")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("[data-capsule-prize]")).not.toHaveText("");
    await page.waitForTimeout(2500); // the machine finishes its turn
  }
  expect(w.errors).toEqual([]);
});

test("Co-op Lobby: two invites in a row (form → plane → mailto → Send another); Copy address", async ({ page, context }) => {
  const w = watch(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => ((window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE = { mailto: [] }));
  await seed(page);
  await open(page, "/#lobby");
  await page.waitForTimeout(800);
  for (let round = 1; round <= 2; round++) {
    await page.fill("#invite-name", `Visitor ${round}`);
    await page.locator(".quest-chip input").nth(round - 1).check({ force: true });
    await page.fill("#invite-msg", `Hello for the ${round === 1 ? "first" : "second"} time.`);
    await page.click("[data-invite-send]");
    await expect(page.locator("[data-plane]")).toBeFocused({ timeout: 8_000 });
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE.mailto.length), { timeout: 12_000 }).toBe(round);
    await expect(page.locator("[data-invite-done]")).toBeVisible({ timeout: 8_000 });
    if (round === 1) {
      await page.locator("[data-invite-again]").click();
      await expect(page.locator("#invite-name")).toBeVisible({ timeout: 5_000 });
    }
  }
  const mailtos = await page.evaluate(() => (window as unknown as { __QA_INVITE: { mailto: string[] } }).__QA_INVITE.mailto);
  expect(mailtos[0]).toContain("Visitor%201");
  expect(mailtos[1]).toContain("Visitor%202");
  await page.getByRole("button", { name: /Copy address/ }).first().click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/@/);
  expect(w.errors).toEqual([]);
});

test("Credits: pause and resume the roll; NEW GAME+ asks first; Back to top lands on the Title", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/#credits");
  const pause = page.locator(".credits__pause");
  await pause.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  const xp0 = (await save(page)).player?.xp;
  await page.locator("[data-run-ngp]").click();
  await page.getByRole("button", { name: /Keep playing/ }).click();
  expect((await save(page)).player?.xp).toBe(xp0);
  await page.locator(".credits__top").click();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 10_000 }).toBeLessThan(40);
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest("#title")), { timeout: 5_000 }).toBe(true);
  expect(w.errors).toEqual([]);
});
