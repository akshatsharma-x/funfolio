// The save file (Bible §6, PART 3): zustand + persist under "funfolio-save", versioned with migrate().
// Pure: actions only change state and emit bus events — toasts, sfx, fx and DOM attributes live in listeners.
// Only the lazily loaded game runtime (and client-only UI) imports this module, so it never ships in the initial bundle.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ACHIEVEMENT_BY_ID } from "@/content/achievements";
import { COINS, COIN_BY_ID } from "@/content/coins";
import { LEVEL_REWARDS, levelForXp, levelTitle, XP_RULES } from "@/content/levels";
import {
  ACHIEVEMENT_GRANTS,
  DEFAULT_EQUIPPED,
  DEFAULT_OWNED,
  PRIZE_BY_ID,
  type ByteHat,
  type ConfettiStyle,
  type PrizeSlot,
} from "@/content/prizes";
import { WORLDS, type WorldId } from "@/content/worlds";
import { CURSOR_SIZE_IDS, CURSOR_SKIN_IDS, type CursorSize, type CursorSkinId } from "@/components/cursor/skins";
import { bus, type Point } from "./bus";
import { FX_LEVELS, LEGACY_PREFS_KEY, MODES, readLegacyPrefs, SAVE_KEY, THEMES, type FxLevel, type Mode, type Theme } from "./prefs";

export { SAVE_KEY };
export const SAVE_VERSION = 1;

export type ReducedMotionSetting = "system" | "reduce" | "full";

export type Settings = {
  sound: boolean;
  volume: number;
  fx: FxLevel;
  theme: Theme;
  mode: Mode;
  /** Override for prefers-reduced-motion: follow the OS, force reduce, or force full motion. */
  reducedMotion: ReducedMotionSetting;
  cursorSize: CursorSize;
  byteVisible: boolean;
};

export type Equipped = { cursorSkin: CursorSkinId; theme: Theme; byteHat: ByteHat | null; confetti: ConfettiStyle };

export type SaveData = {
  player: { xp: number; level: number; wallet: number; coinIds: string[]; xpClaims: string[] };
  achievements: Record<string, number>;
  visitedWorlds: WorldId[];
  games: { highScores: Record<string, number>; plays: Record<string, number> };
  inventory: { owned: string[]; equipped: Equipped };
  settings: Settings;
  stats: { clicks: number; sessionStart: number; timePlayedMs: number; eggsFound: string[] };
  meta: { saveVersion: number; lastVisit: number | null; lastSeenPatch: string | null };
  /** BYTE (PART 4): home position as fractions of the free viewport (null = docked bottom-right), minimized, and the
   *  once-only lines already said (world lines, first-run tips). Position + minimized survive a reset. */
  byte: { fx: number | null; fy: number | null; minimized: boolean; said: string[] };
};

export type SaveActions = {
  /** Grants XP once per one-time reason (visit:/open:/cta:/coin:/achievement:); "game:" XP is capped per session. */
  addXp: (amount: number, reason: string, origin?: Point) => number;
  collectCoin: (id: string, origin?: Point) => boolean;
  unlock: (id: string) => boolean;
  visitWorld: (id: WorldId) => boolean;
  recordScore: (game: string, score: number) => { best: boolean; highScore: number };
  buy: (itemId: string) => boolean;
  equip: (slot: PrizeSlot, itemId: string | null) => boolean;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => boolean;
  resetSave: () => void;
  /** Bookkeeping */
  startSession: () => number | null;
  addStats: (clicks: number, playedMs: number) => void;
  markPatchSeen: (version: string) => void;
  findEgg: (id: string) => boolean;
  /** A spare coin (sticker peels…): +1 wallet once per id — not one of the 12 hidden coins. */
  collectSpare: (id: string, origin?: Point) => boolean;
  setBytePos: (fx: number | null, fy: number | null) => void;
  setByteMinimized: (minimized: boolean) => void;
  /** Marks a once-only BYTE line as said; false if it already was. */
  markByteSaid: (key: string) => boolean;
};

export type SaveStore = SaveData & SaveActions;

const DEFAULT_SETTINGS: Settings = {
  sound: false, // R5: sound is OFF by default
  volume: 0.7,
  fx: "normal",
  theme: "night",
  mode: "play",
  reducedMotion: "system",
  cursorSize: "normal",
  byteVisible: true,
};

const ONE_TIME_REASON = /^(visit|open|cta|coin|spare|achievement):/;
const SPARE_XP = 10;
/** Explorer = every world except the credits (credits = completionist). */
const EXPLORER_WORLDS = WORLDS.map((w) => w.id).filter((id) => id !== "credits");
let sessionGameXp = 0;

function freshData(now = Date.now()): SaveData {
  return {
    player: { xp: 0, level: 1, wallet: 0, coinIds: [], xpClaims: [] },
    achievements: {},
    visitedWorlds: [],
    games: { highScores: {}, plays: {} },
    inventory: { owned: [...DEFAULT_OWNED], equipped: { ...DEFAULT_EQUIPPED } },
    settings: { ...DEFAULT_SETTINGS },
    stats: { clicks: 0, sessionStart: now, timePlayedMs: 0, eggsFound: [] },
    meta: { saveVersion: SAVE_VERSION, lastVisit: null, lastSeenPatch: null },
    byte: { fx: null, fy: null, minimized: false, said: [] },
  };
}

/** New saves inherit theme / effects / mode / cursor size from the PART 1–2 prefs key (if present). */
function initialData(): SaveData {
  const data = freshData();
  if (typeof window === "undefined") return data;
  const legacy = readLegacyPrefs();
  if ((THEMES as readonly string[]).includes(legacy.theme ?? "") && legacy.theme !== "retro") data.settings.theme = legacy.theme as Theme;
  if ((FX_LEVELS as readonly string[]).includes(legacy.fx ?? "")) data.settings.fx = legacy.fx as FxLevel;
  if ((MODES as readonly string[]).includes(legacy.mode ?? "")) data.settings.mode = legacy.mode as Mode;
  if ((CURSOR_SIZE_IDS as readonly string[]).includes(legacy.cursorSize ?? "")) data.settings.cursorSize = legacy.cursorSize as CursorSize;
  data.inventory.equipped.theme = data.settings.theme;
  return data;
}

// ── Normalization: any persisted shape (old version, partial, hand-edited) → a valid SaveData ──────────────────
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, d: number, min = 0) => (typeof v === "number" && Number.isFinite(v) ? Math.max(min, v) : d);
const strs = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))] : []);
const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => ((allowed as readonly unknown[]).includes(v) ? (v as T) : d);
const numMap = (v: unknown) =>
  isObj(v) ? Object.fromEntries(Object.entries(v).filter(([, n]) => typeof n === "number" && Number.isFinite(n))) as Record<string, number> : {};

export function normalizeSave(input: unknown): SaveData {
  const d = freshData();
  const s = isObj(input) ? input : {};
  const player = isObj(s.player) ? s.player : {};
  const inv = isObj(s.inventory) ? s.inventory : {};
  const eq = isObj(inv.equipped) ? inv.equipped : {};
  const set = isObj(s.settings) ? s.settings : {};
  const stats = isObj(s.stats) ? s.stats : {};
  const meta = isObj(s.meta) ? s.meta : {};
  const games = isObj(s.games) ? s.games : {};
  const byte = isObj(s.byte) ? s.byte : {};
  const frac = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
  const worldIds = WORLDS.map((w) => w.id);

  const xp = num(player.xp, 0);
  const owned = [...new Set([...DEFAULT_OWNED, ...strs(inv.owned).filter((id) => id in PRIZE_BY_ID)])];
  const ownsValue = (slot: PrizeSlot, value: unknown) => owned.some((id) => PRIZE_BY_ID[id].slot === slot && PRIZE_BY_ID[id].value === value);
  const theme = pick(set.theme, THEMES, d.settings.theme);
  const safeTheme: Theme = theme === "retro" && !ownsValue("theme", "retro") ? "night" : theme;

  return {
    player: {
      xp,
      level: levelForXp(xp),
      wallet: Math.floor(num(player.wallet, 0)),
      coinIds: strs(player.coinIds).filter((id) => id in COIN_BY_ID),
      xpClaims: strs(player.xpClaims),
    },
    // only known ids with a timestamp (a renamed id needs a migration step, not a silent carry-over)
    achievements: Object.fromEntries(Object.entries(numMap(s.achievements)).filter(([id]) => id in ACHIEVEMENT_BY_ID)),
    visitedWorlds: strs(s.visitedWorlds).filter((id): id is WorldId => (worldIds as string[]).includes(id)),
    games: { highScores: numMap(games.highScores), plays: numMap(games.plays) },
    inventory: {
      owned,
      equipped: {
        cursorSkin: ownsValue("cursorSkin", eq.cursorSkin) ? pick(eq.cursorSkin, CURSOR_SKIN_IDS, d.inventory.equipped.cursorSkin) : d.inventory.equipped.cursorSkin,
        theme: safeTheme,
        byteHat: typeof eq.byteHat === "string" && ownsValue("byteHat", eq.byteHat) ? (eq.byteHat as ByteHat) : null,
        confetti: ownsValue("confetti", eq.confetti) ? (eq.confetti as ConfettiStyle) : d.inventory.equipped.confetti,
      },
    },
    settings: {
      sound: typeof set.sound === "boolean" ? set.sound : d.settings.sound,
      volume: Math.min(1, num(set.volume, d.settings.volume)),
      fx: pick(set.fx, FX_LEVELS, d.settings.fx),
      theme: safeTheme,
      mode: pick(set.mode, MODES, d.settings.mode),
      reducedMotion: pick(set.reducedMotion, ["system", "reduce", "full"] as const, d.settings.reducedMotion),
      cursorSize: pick(set.cursorSize, CURSOR_SIZE_IDS, d.settings.cursorSize),
      byteVisible: typeof set.byteVisible === "boolean" ? set.byteVisible : d.settings.byteVisible,
    },
    stats: {
      clicks: Math.floor(num(stats.clicks, 0)),
      sessionStart: num(stats.sessionStart, d.stats.sessionStart),
      timePlayedMs: num(stats.timePlayedMs, 0),
      eggsFound: strs(stats.eggsFound),
    },
    meta: {
      saveVersion: SAVE_VERSION,
      lastVisit: typeof meta.lastVisit === "number" ? meta.lastVisit : null,
      lastSeenPatch: typeof meta.lastSeenPatch === "string" ? meta.lastSeenPatch : null,
    },
    byte: { fx: frac(byte.fx), fy: frac(byte.fy), minimized: byte.minimized === true, said: strs(byte.said).slice(0, 64) },
  };
}

/**
 * Migration ladder. Each step upgrades one version; add new steps at the bottom when SAVE_VERSION increases, e.g.
 *   if (version < 2) data = { ...data, player: { ...data.player, streak: 0 } }
 * normalizeSave() then fills anything missing, so a step only has to handle renames / reshapes.
 */
export function migrateSave(persisted: unknown, version: number): SaveData {
  let data: Record<string, unknown> = isObj(persisted) ? { ...persisted } : {};
  if (version < 1) {
    // v0 (pre-release drafts): settings lived at the top level and coins were called "coins".
    const legacy = data as Record<string, unknown> & { coins?: unknown; theme?: unknown; sound?: unknown };
    const player = isObj(data.player) ? data.player : {};
    data = {
      ...data,
      player: { ...player, coinIds: player.coinIds ?? legacy.coins },
      settings: isObj(data.settings) ? data.settings : { theme: legacy.theme, sound: legacy.sound },
    };
  }
  return normalizeSave(data);
}

const pickData = (s: SaveStore): SaveData => ({
  player: s.player,
  achievements: s.achievements,
  visitedWorlds: s.visitedWorlds,
  games: s.games,
  inventory: s.inventory,
  settings: s.settings,
  stats: s.stats,
  meta: s.meta,
  byte: s.byte,
});

export const useSave = create<SaveStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addXp(amount, reason, origin) {
        if (!(amount > 0)) return 0;
        const s = get();
        const once = ONE_TIME_REASON.test(reason);
        if (once && s.player.xpClaims.includes(reason)) return 0;
        let grant = Math.round(amount);
        if (reason.startsWith("game:")) {
          grant = Math.min(grant, XP_RULES.gameSessionCap - sessionGameXp);
          if (grant <= 0) return 0;
          sessionGameXp += grant;
        }
        const xp = s.player.xp + grant;
        const level = levelForXp(xp);
        const rewards: string[] = [];
        for (let lv = s.player.level + 1; lv <= level; lv++) {
          const prize = LEVEL_REWARDS[lv];
          if (prize && !s.inventory.owned.includes(prize)) rewards.push(prize);
        }
        set({
          player: { ...s.player, xp, level, xpClaims: once ? [...s.player.xpClaims, reason] : s.player.xpClaims },
          inventory: rewards.length ? { ...s.inventory, owned: [...s.inventory.owned, ...rewards] } : s.inventory,
        });
        bus.emit("xp:gained", { amount: grant, reason, total: xp, origin });
        if (level > s.player.level) bus.emit("level:up", { level, title: levelTitle(level), rewards });
        return grant;
      },

      collectCoin(id, origin) {
        const coin = COIN_BY_ID[id];
        const s = get();
        if (!coin || s.player.coinIds.includes(id)) return false;
        const coinIds = [...s.player.coinIds, id];
        set({ player: { ...s.player, coinIds, wallet: s.player.wallet + 1 } });
        bus.emit("coin:collected", { id, name: coin.name, found: coinIds.length, total: COINS.length, origin });
        get().addXp(XP_RULES.coin, `coin:${id}`, origin);
        if (coinIds.length >= 5) get().unlock("coin-collector");
        if (coinIds.length >= COINS.length) get().unlock("treasure-hunter");
        return true;
      },

      unlock(id) {
        const def = ACHIEVEMENT_BY_ID[id];
        const s = get();
        if (!def || s.achievements[id]) return false;
        const grant = ACHIEVEMENT_GRANTS[id];
        set({
          achievements: { ...s.achievements, [id]: Date.now() },
          inventory: grant && !s.inventory.owned.includes(grant) ? { ...s.inventory, owned: [...s.inventory.owned, grant] } : s.inventory,
        });
        bus.emit("achievement:unlocked", { id });
        get().addXp(def.xp, `achievement:${id}`);
        return true;
      },

      visitWorld(id) {
        const s = get();
        if (s.visitedWorlds.includes(id)) return false;
        const visitedWorlds = [...s.visitedWorlds, id];
        set({ visitedWorlds });
        bus.emit("world:first-visit", { id });
        get().addXp(XP_RULES.firstVisit, `visit:${id}`);
        if (visitedWorlds.length >= 3) get().unlock("tourist");
        if (EXPLORER_WORLDS.every((w) => visitedWorlds.includes(w))) get().unlock("explorer");
        if (id === "credits") get().unlock("completionist");
        return true;
      },

      recordScore(game, score) {
        const s = get();
        const previous = s.games.highScores[game];
        const best = previous === undefined || score > previous;
        const highScore = best ? score : previous;
        set({
          games: {
            highScores: { ...s.games.highScores, [game]: highScore },
            plays: { ...s.games.plays, [game]: (s.games.plays[game] ?? 0) + 1 },
          },
        });
        return { best, highScore };
      },

      buy(itemId) {
        const item = PRIZE_BY_ID[itemId];
        const s = get();
        if (!item) return false;
        if (s.inventory.owned.includes(itemId)) {
          bus.emit("shop:denied", { itemId, reason: "owned" });
          return false;
        }
        if (item.grantedBy) {
          bus.emit("shop:denied", { itemId, reason: "locked" });
          return false;
        }
        if (s.player.wallet < item.price) {
          bus.emit("shop:denied", { itemId, reason: "funds" });
          return false;
        }
        set({ player: { ...s.player, wallet: s.player.wallet - item.price }, inventory: { ...s.inventory, owned: [...s.inventory.owned, itemId] } });
        bus.emit("shop:bought", { itemId });
        return true;
      },

      equip(slot, itemId) {
        const s = get();
        let value: string | null;
        if (itemId === null) {
          value = slot === "byteHat" ? null : DEFAULT_EQUIPPED[slot];
        } else {
          const item = PRIZE_BY_ID[itemId];
          if (!item || item.slot !== slot || !s.inventory.owned.includes(itemId)) return false;
          value = item.value;
        }
        // Themes go through setSetting so ownership checks and lights-out / pixel-perfect stay in one place.
        if (slot === "theme") return get().setSetting("theme", (value ?? "night") as Theme);
        set({ inventory: { ...s.inventory, equipped: { ...s.inventory.equipped, [slot]: value } as Equipped } });
        return true;
      },

      setSetting(key, value) {
        const s = get();
        const k = key as keyof Settings;
        let v: unknown = value;
        if (k === "theme") {
          const theme = v as Theme;
          if (!THEMES.includes(theme)) return false;
          if (theme === "retro" && !s.inventory.owned.includes("theme-retro")) return false;
          if (theme !== s.settings.theme) {
            set({ settings: { ...s.settings, theme }, inventory: { ...s.inventory, equipped: { ...s.inventory.equipped, theme } } });
            get().unlock("lights-out");
            if (theme === "retro") get().unlock("pixel-perfect");
          }
          return true;
        }
        if (k === "volume") v = Math.max(0, Math.min(1, Number(v) || 0));
        if (s.settings[k] === v) return true;
        set({ settings: { ...s.settings, [k]: v } as Settings });
        if (k === "mode" && v === "speedrun") get().unlock("speedrunner");
        return true;
      },

      resetSave() {
        // Progress is erased; settings (sound, motion, cursor size…) stay — they are accessibility preferences.
        const s = get();
        const fresh = freshData();
        sessionGameXp = 0;
        set({
          ...fresh,
          settings: { ...s.settings, theme: s.settings.theme === "retro" ? "night" : s.settings.theme },
          meta: { ...fresh.meta, lastVisit: Date.now() },
          byte: { ...fresh.byte, fx: s.byte.fx, fy: s.byte.fy, minimized: s.byte.minimized },
        });
        bus.emit("save:reset", {});
      },

      startSession() {
        const s = get();
        const previous = s.meta.lastVisit;
        set({ stats: { ...s.stats, sessionStart: Date.now() }, meta: { ...s.meta, lastVisit: Date.now() } });
        return previous;
      },

      addStats(clicks, playedMs) {
        if (clicks <= 0 && playedMs <= 0) return;
        const s = get();
        set({ stats: { ...s.stats, clicks: s.stats.clicks + clicks, timePlayedMs: s.stats.timePlayedMs + playedMs } });
      },

      markPatchSeen(version) {
        const s = get();
        if (s.meta.lastSeenPatch !== version) set({ meta: { ...s.meta, lastSeenPatch: version } });
      },

      findEgg(id) {
        const s = get();
        if (s.stats.eggsFound.includes(id)) return false;
        set({ stats: { ...s.stats, eggsFound: [...s.stats.eggsFound, id] } });
        return true;
      },

      collectSpare(id, origin) {
        const s = get();
        const reason = `spare:${id}`;
        if (!id || s.player.xpClaims.includes(reason)) return false;
        set({ player: { ...s.player, wallet: s.player.wallet + 1 } });
        bus.emit("item:acquired", { title: "Spare coin", detail: "+1 wallet coin (spend it at the Prize Counter)", icon: "coin" });
        get().addXp(SPARE_XP, reason, origin); // also records the one-time claim
        return true;
      },

      setBytePos(fx, fy) {
        const s = get();
        if (s.byte.fx !== fx || s.byte.fy !== fy) set({ byte: { ...s.byte, fx, fy } });
      },

      setByteMinimized(minimized) {
        const s = get();
        if (s.byte.minimized !== minimized) set({ byte: { ...s.byte, minimized } });
      },

      markByteSaid(key) {
        const s = get();
        if (s.byte.said.includes(key)) return false;
        set({ byte: { ...s.byte, said: [...s.byte.said, key] } });
        return true;
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: pickData,
      migrate: migrateSave,
      // Deep-normalize whatever was stored so fields added later always get defaults.
      // (persisted is undefined when nothing is stored yet — keep the fresh/legacy-seeded state then.)
      merge: (persisted, current) => (persisted === undefined ? current : { ...current, ...normalizeSave(persisted) }),
      onRehydrateStorage: () => () => {
        try {
          localStorage.removeItem(LEGACY_PREFS_KEY);
        } catch {
          // storage blocked — nothing to clean up
        }
      },
    },
  ),
);

/** For tests/QA: the shape persisted under SAVE_KEY. */
export const saveSnapshot = (): SaveData => pickData(useSave.getState());
