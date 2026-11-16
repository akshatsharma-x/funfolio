// Global modes on <html> (Bible §7): data-theme · data-fx · data-mode · data-cursor (variant)
// + data-cursor-skin · data-cursor-size · data-motion · data-world · data-js.
// PART 3: the save (src/lib/store.ts, key "funfolio-save") is the source of truth; the pre-paint script below reads it
// before first paint so there is no flash. The PART 1–2 key "funfolio:prefs" is read once for migration, then removed.

import { CURSOR_SIZE_IDS, CURSOR_SKIN_IDS, DEFAULT_CURSOR_SKIN } from "@/components/cursor/skins";
import { WORLDS } from "@/content/worlds";

export const SAVE_KEY = "funfolio-save";
export const LEGACY_PREFS_KEY = "funfolio:prefs";

export const THEMES = ["night", "day", "retro"] as const;
export type Theme = (typeof THEMES)[number];

export const FX_LEVELS = ["chill", "normal", "chaos"] as const;
export type FxLevel = (typeof FX_LEVELS)[number];

export const MODES = ["play", "speedrun"] as const;
export type Mode = (typeof MODES)[number];

/** PART 1–2 prefs shape (migration only). */
export type LegacyPrefs = { theme?: string; fx?: string; mode?: string; cursorSkin?: string; cursorSize?: string };

export function readLegacyPrefs(): LegacyPrefs {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_PREFS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as LegacyPrefs) : {};
  } catch {
    return {};
  }
}

/** Session-only overrides from the URL (?theme=, ?fx=, ?speedrun) — applied on top of the save, never persisted. */
export type UrlOverrides = { theme?: Theme; fx?: FxLevel; speedrun?: boolean };

export function readUrlOverrides(): UrlOverrides {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const theme = q.get("theme");
  const fx = q.get("fx");
  return {
    theme: (THEMES as readonly string[]).includes(theme ?? "") ? (theme as Theme) : undefined,
    fx: (FX_LEVELS as readonly string[]).includes(fx ?? "") ? (fx as FxLevel) : undefined,
    speedrun: q.has("speedrun") || q.get("mode") === "speedrun" || undefined,
  };
}

const list = (values: readonly string[]) => JSON.stringify(values);
/** Worlds behind the Launchpad's soft gate: a deep link to any of them (or to a Skill Tree entry, `#skill-…`, PART 8)
 *  starts with the Quest Log open (PART 7). */
const PAST_THE_GATE = WORLDS.slice(WORLDS.findIndex((w) => w.id === "quests")).map((w) => w.id);

/**
 * Inline <head> script, ES5, no imports. URL params win (?theme=, ?fx=, ?speedrun), then the save, then legacy prefs,
 * then defaults. Reduced motion (OS, or the in-app override) and Speedrun Mode force data-fx="chill" unless ?fx= is set.
 * PART 5: data-boot = "full" (first visit) | "fast" (a save exists) on the home page only — never in Speedrun Mode,
 * never on a deep link (#world), never with ?boot=0 (?boot=full forces the full boot). It shows the boot curtain.
 * PART 7: data-quest-log = "open" | "locked" (the Launchpad's soft gate): open when the save opened it, in Speedrun Mode,
 * under reduced motion, or on a deep link past the gate. Without JS there is no attribute — the Quest Log is just open.
 */
export const PREPAINT_SCRIPT = `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),s={},e={},p={};try{var r=JSON.parse(localStorage.getItem(${JSON.stringify(
  SAVE_KEY,
)})||"null");if(r&&r.state){s=r.state.settings||{};e=(r.state.inventory||{}).equipped||{}}}catch(x){}if(!s.theme){try{p=JSON.parse(localStorage.getItem(${JSON.stringify(
  LEGACY_PREFS_KEY,
)})||"{}")||{}}catch(x){}s={theme:p.theme,fx:p.fx,mode:p.mode,cursorSize:p.cursorSize};e={cursorSkin:p.cursorSkin}}function pick(v,l,f){return l.indexOf(v)>-1?v:f}var T=${list(
  THEMES,
)},F=${list(FX_LEVELS)},M=${list(MODES)},S=${list(CURSOR_SKIN_IDS)},Z=${list(
  CURSOR_SIZE_IDS,
)};var os=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,rm=s.reducedMotion,reduced=rm==="reduce"||(rm!=="full"&&os);var mode=q.has("speedrun")||q.get("mode")==="speedrun"?"speedrun":pick(s.mode,M,"play");d.setAttribute("data-theme",pick(q.get("theme"),T,pick(s.theme,T,"night")));d.setAttribute("data-fx",pick(q.get("fx"),F,reduced||mode==="speedrun"?"chill":pick(s.fx,F,"normal")));d.setAttribute("data-mode",mode);var bq=q.get("boot");if(location.pathname==="/"&&mode!=="speedrun"&&bq!=="0"&&(!location.hash||bq==="full")){var lv=r&&r.state&&r.state.meta&&r.state.meta.lastVisit;d.setAttribute("data-boot",bq==="full"||!lv?"full":"fast")}if(rm==="reduce"||rm==="full")d.setAttribute("data-motion",rm);d.setAttribute("data-cursor","default");d.setAttribute("data-cursor-skin",pick(e.cursorSkin,S,${JSON.stringify(
  DEFAULT_CURSOR_SKIN,
)}));d.setAttribute("data-cursor-size",pick(s.cursorSize,Z,"normal"));var gt=r&&r.state&&r.state.gates,hs=location.hash.slice(1);d.setAttribute("data-quest-log",(gt&&gt.indexOf&&gt.indexOf("quest-log")>-1)||mode==="speedrun"||reduced||${list(
  PAST_THE_GATE,
)}.indexOf(hs)>-1||hs.indexOf("skill-")===0?"open":"locked");d.setAttribute("data-world","title");d.setAttribute("data-js","")}catch(x){}})();`;
