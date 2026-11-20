// Lazy parts that can't load — offline after the first visit, a flaky network, or an open tab after a redeploy replaced
// the chunk files — must never take the page down with them (PART 18). Turbopack caches a failed chunk for the page's
// lifetime, so there is no retry: the part is skipped (or falls back to its plain version) and, when the visitor asked
// for it, a toast says so in the Bible's voice. Client-only; the toast reaches the runtime through the bus.
import { bus } from "./bus";

const told = new Set<string>();

/** Tells the visitor (once per part) that `what` didn't load, e.g. "the pause menu". */
export function chunkFailed(what: string) {
  if (told.has(what)) return;
  told.add(what);
  bus.emit("item:acquired", {
    kicker: "Oops — that's a glitch",
    title: `${what[0]?.toUpperCase()}${what.slice(1)} didn't load`,
    detail: typeof navigator !== "undefined" && !navigator.onLine ? "You're offline — reconnect, then reload the page." : "Reload the page to try again.",
    icon: "bug",
  });
}

const Nothing = () => null;

/**
 * For `next/dynamic`: `dynamic(() => import("./PauseMenu").catch(orNothing("the pause menu")), { ssr: false })` renders
 * nothing instead of throwing when the chunk fails (a throw would unmount the whole runtime — the HUD went with it).
 * Pass `null` for parts the visitor didn't ask for (decor, portals whose server-rendered version stays).
 */
export const orNothing =
  (what: string | null) =>
  (): never => {
    if (what) chunkFailed(what);
    return { default: Nothing } as never;
  };
