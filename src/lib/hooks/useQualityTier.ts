import { useSyncExternalStore } from "react";
import { dropQualityTier, getQualityTier, subscribeQualityTier, type QualityTier } from "../quality";

/**
 * high | low | none from hardwareConcurrency, deviceMemory, coarse pointer and WebGL support.
 * SSR/hydration report "none" (no 3D on the server); the detected tier applies right after. `drop()` steps it down.
 */
export function useQualityTier(): { tier: QualityTier; drop: () => QualityTier } {
  const tier = useSyncExternalStore(subscribeQualityTier, getQualityTier, () => "none" as const);
  return { tier, drop: dropQualityTier };
}
