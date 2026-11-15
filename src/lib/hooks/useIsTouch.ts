import { useMediaQuery } from "./useMediaQuery";

/** True on coarse pointers (phones/tablets). Hover-only effects (tilt, hover sfx) should switch off. */
export function useIsTouch(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
