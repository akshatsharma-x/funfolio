// Device quality tier for 3D / physics / heavy FX (Bible R7). Detected once on the client; can only go DOWN at runtime
// (e.g. drei <PerformanceMonitor> calls dropQualityTier() when frames suffer).

export type QualityTier = "high" | "low" | "none";

const ORDER: readonly QualityTier[] = ["high", "low", "none"];

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

let tier: QualityTier | null = null;
const listeners = new Set<() => void>();

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    // Free the probe context immediately — the budget is max 2 live WebGL contexts (Bible §10).
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Pure detection from hardware hints. high = full 3D, low = reduced 3D, none = no WebGL (SVG fallbacks). */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "none";
  if (!hasWebGL()) return "none";
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8; // Safari/Firefox don't expose it
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const saveData = nav.connection?.saveData === true;
  if (saveData || coarse || cores <= 4 || memory <= 4) return "low";
  return "high";
}

export function getQualityTier(): QualityTier {
  if (tier === null) tier = detectQualityTier();
  return tier;
}

/** Steps the tier down one level (never up). Returns the new tier. */
export function dropQualityTier(): QualityTier {
  const current = getQualityTier();
  const next = ORDER[Math.min(ORDER.indexOf(current) + 1, ORDER.length - 1)];
  if (next !== current) {
    tier = next;
    listeners.forEach((fn) => fn());
  }
  return next;
}

export function subscribeQualityTier(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
