// One polite live region for game announcements (toasts, level-ups) — screen readers hear what the eye sees.
// While a modal <dialog> is open the rest of the page is inert (and so is a live region outside it), so the
// message goes to the open dialog's own region instead (Modal renders one).

let region: HTMLElement | null = null;

function pageRegion(): HTMLElement {
  if (!region || !region.isConnected) {
    region = document.createElement("div");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.className = "sr-only";
    region.id = "game-announcer";
    document.body.append(region);
  }
  return region;
}

export function announce(text: string): void {
  if (typeof document === "undefined") return;
  const dialog = document.querySelector<HTMLElement>("dialog[open] [data-announcer]");
  const target = dialog ?? pageRegion();
  // Clear first so the same message twice is still announced.
  target.textContent = "";
  window.setTimeout(() => {
    target.textContent = text;
  }, 40);
}
