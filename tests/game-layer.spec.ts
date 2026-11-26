// The game layer around the worlds: the boot (first visit and CONTINUE?), the HUD's buttons, the pause menu (every tab,
// twice), the map, the level rail, the number keys, the terminal, Ask BYTE, typed eggs, the cheat code and the
// right-click menu.
import { expect, test } from "@playwright/test";
import { coins, open, save, seed, show, watch, world } from "./helpers";

test("the boot: INSERT COIN → START MUTED on a first visit (coin #1); a returning player gets CONTINUE?", async ({ page }) => {
  const w = watch(page);
  await page.goto("/");
  await expect(page.locator("[data-boot-coin]")).toBeVisible({ timeout: 30_000 });
  await page.locator("[data-boot-coin]").click();
  await page.locator('[data-boot-start="muted"]').click();
  await expect(page.locator("dialog.boot[open], dialog[open] [data-boot-coin]")).toHaveCount(0, { timeout: 8_000 });
  await expect.poll(() => coins(page)).toContain("boot");
  expect((await save(page)).settings?.sound).toBe(false);
  await page.reload();
  await expect(page.locator("[data-boot-yes]")).toBeVisible({ timeout: 30_000 });
  await page.locator("[data-boot-yes]").click();
  await expect(page.locator("[data-boot-yes]")).toBeHidden({ timeout: 8_000 });
  expect(w.errors).toEqual([]);
});

test("the HUD: theme, sound and Speedrun Mode toggle both ways", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  const html = page.locator("html");
  const theme = page.locator("[data-hud-theme]");
  const before = await html.getAttribute("data-theme");
  await theme.click();
  await expect(html).not.toHaveAttribute("data-theme", before ?? "night", { timeout: 5_000 });
  await theme.click();
  await expect(html).toHaveAttribute("data-theme", before ?? "night", { timeout: 5_000 });
  const sound = page.locator('header.hud button[aria-keyshortcuts="Shift+S"]');
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await page.locator('header.hud button[aria-keyshortcuts="Shift+R"]').click();
  await expect(html).toHaveAttribute("data-mode", "speedrun");
  await expect(page.locator(".speedrun-summary")).toBeVisible();
  await page.keyboard.press("Shift+R");
  await expect(html).toHaveAttribute("data-mode", "play");
  expect(w.errors).toEqual([]);
});

test("the pause menu: Esc opens it, every tab shows its panel, Esc closes it — twice", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  for (let round = 0; round < 2; round++) {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const tabs = dialog.getByRole("tab");
    const n = await tabs.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
      await expect(dialog.locator('[role="tabpanel"]:not([hidden])')).toHaveCount(1);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0, { timeout: 5_000 });
  }
  expect(w.errors).toEqual([]);
});

test("getting around: the map, the level rail and the number keys each land on their world", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.keyboard.press("m");
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole("button", { name: /Cartridge Vault/ }).first().click();
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("vault");
  await page.locator(".rail").getByRole("link", { name: /Skill Tree/ }).first().click();
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("skills");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("3");
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("lab");
  await page.keyboard.press("0");
  await expect.poll(() => world(page), { timeout: 10_000 }).toBe("title");
  expect(w.errors).toEqual([]);
});

test("AKSHAT-OS: ` opens the terminal, commands answer, exit closes; the HUD button reopens it", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("`");
  await expect(page.locator("dialog.terminal[open]")).toBeVisible({ timeout: 8_000 });
  const run = async (cmd: string) => {
    await page.fill("#terminal-input", cmd);
    await page.press("#terminal-input", "Enter");
    return page.locator(".terminal__entry").last().innerText();
  };
  expect(await run("help")).toMatch(/whoami/);
  expect(await run("whoami")).not.toBe("");
  expect(await run("experience")).toMatch(/United Airlines/);
  await run("exit");
  await expect(page.locator("dialog.terminal[open]")).toHaveCount(0, { timeout: 5_000 });
  await page.locator('header.hud button[aria-keyshortcuts="`"]').click();
  await expect(page.locator("dialog.terminal[open]")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.terminal[open]")).toHaveCount(0, { timeout: 5_000 });
  expect(w.errors).toEqual([]);
});

test("Ask BYTE: a topic, a typed question, Esc — and the conversation is still there on reopening", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.locator("[data-byte-ask]").click();
  const chat = page.locator("[data-chat]");
  await expect(chat.locator("[data-chip]").first()).toBeVisible({ timeout: 8_000 });
  await chat.locator("[data-chip]", { hasText: "Best project?" }).click();
  await expect(chat.locator(".chat__line--byte").last()).toContainText(/\d+ projects/, { timeout: 5_000 });
  await page.fill("#chat-input", "what's his cgpa?");
  await page.press("#chat-input", "Enter");
  await expect(chat.locator(".chat__line--byte").last()).toContainText("CGPA", { timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(chat).toHaveCount(0);
  await expect(page.locator("[data-byte-ask]")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(chat.locator(".chat__line")).toHaveCount(5, { timeout: 5_000 }); // greeting, 2 questions, 2 answers
  expect(w.errors).toEqual([]);
});

test("secrets: typing a word finds its egg; the cheat code switches on the retro theme; right-click opens the game menu", async ({ page }) => {
  const w = watch(page);
  await seed(page);
  await open(page, "/");
  await page.mouse.move(700, 450);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.type("coffee", { delay: 60 });
  await expect.poll(async () => (await save(page)).stats?.eggsFound ?? [], { timeout: 5_000 }).toContain("word-coffee");
  for (const k of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]) await page.keyboard.press(k);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "retro", { timeout: 5_000 });
  await show(page, "#profile .world-header");
  await page.mouse.click(700, 450, { button: "right" });
  const menu = page.getByRole("menu", { name: "Game menu" });
  await expect(menu).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  expect(w.errors).toEqual([]);
});
