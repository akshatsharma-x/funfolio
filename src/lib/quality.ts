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

/** "gpu" | "software" (a CPU rasterizer — far too slow for the 3D island) | "none". */
function probeWebGL(): "gpu" | "software" | "none" {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "none";
    let renderer = String(gl.getParameter(gl.RENDERER));
    // Chrome and Safari mask RENDERER ("WebKit WebGL") and need the debug extension for the real name; Firefox
    // reports it directly and logs a deprecation warning if the extension is touched.
    const masked = /^webkit webgl$/i.test(renderer);
    if (masked) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
      // Free the probe context right away (budget: max 2 live WebGL contexts, Bible §10). Firefox logs a warning
      // for a deliberately lost context, so there the 1×1 probe is simply left to garbage collection.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer) ? "software" : "gpu";
  } catch {
    return "none";
  }
}

/** Pure detection from hardware hints. high = full 3D, low = reduced 3D, none = no WebGL (SVG fallbacks). */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "none";
  if (probeWebGL() !== "gpu") return "none"; // no WebGL, or only a software rasterizer → the SVG fallbacks
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
