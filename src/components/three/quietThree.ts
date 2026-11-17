// R3F 9.8 (the latest stable) still creates a THREE.Clock, which three r183+ reports as deprecated whenever a canvas
// mounts. Every R3F canvas imports this module first: it drops exactly that message (R3F 10 moves to THREE.Timer) and
// forwards everything else three logs to the console (DECISIONS #58).
import * as THREE from "three";

let installed = false;
export function quietThree(): void {
  if (installed) return;
  installed = true;
  const previous = THREE.getConsoleFunction();
  THREE.setConsoleFunction((type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock: This module has been deprecated")) return;
    if (previous) return previous(type, message, ...params);
    const out = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
    const trace = params[0] as { isStackTrace?: boolean; getError?: (m: string) => unknown } | undefined;
    if (trace?.isStackTrace && trace.getError) out(trace.getError(message));
    else out(message, ...params);
  });
}
quietThree();
