// Global modes on <html> (Bible §7): data-theme · data-fx · data-mode · data-cursor (+ data-world, data-js).
// The pre-paint script applies them before first paint (docs/DECISIONS.md #5); PART 3's store takes over the writes.

export const PREFS_KEY = "funfolio:prefs";

export const THEMES = ["night", "day", "retro"] as const;
export type Theme = (typeof THEMES)[number];

export const FX_LEVELS = ["chill", "normal", "chaos"] as const;
export type FxLevel = (typeof FX_LEVELS)[number];

export const MODES = ["play", "speedrun"] as const;
export type Mode = (typeof MODES)[number];

export type Prefs = { theme?: Theme; fx?: FxLevel; mode?: Mode; cursor?: string };

export function readPrefs(): Prefs {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Prefs) : {};
  } catch {
    return {};
  }
}

export function writePrefs(patch: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch }));
  } catch {
    // storage unavailable (private mode / blocked) — the attribute change still applies for this visit
  }
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  writePrefs({ theme });
}

const list = (values: readonly string[]) => JSON.stringify(values);

/**
 * Inline <head> script, ES5, no imports. URL params win (?theme=, ?fx=, ?speedrun), then saved prefs, then defaults.
 * prefers-reduced-motion forces data-fx="chill" unless ?fx= is given explicitly.
 */
export const PREPAINT_SCRIPT = `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),p={};try{p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}")||{}}catch(e){}function pick(v,l,f){return l.indexOf(v)>-1?v:f}var T=${list(THEMES)},F=${list(FX_LEVELS)},M=${list(
  MODES,
)};var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;d.setAttribute("data-theme",pick(q.get("theme"),T,pick(p.theme,T,"night")));d.setAttribute("data-fx",pick(q.get("fx"),F,rm?"chill":pick(p.fx,F,"normal")));d.setAttribute("data-mode",q.has("speedrun")||q.get("mode")==="speedrun"?"speedrun":pick(p.mode,M,"play"));d.setAttribute("data-cursor",typeof p.cursor==="string"&&/^[a-z0-9-]{1,24}$/.test(p.cursor)?p.cursor:"default");d.setAttribute("data-world","title");d.setAttribute("data-js","")}catch(e){}})();`;
