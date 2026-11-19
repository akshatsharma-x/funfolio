"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { command } from "@/lib/commands";
import { locateCursor } from "@/lib/cursor";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { printBanner } from "./devtools";

export type MenuAt = { x: number; y: number; returnTo: HTMLElement | null };
type Item = { id: string; label: string; icon: PixelIconName; disabled?: boolean; run: () => void };

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/**
 * The game-style context menu (PART 16): Copy email · Download résumé · Toggle sound · Open terminal · Locate cursor ·
 * Inspect. A WAI-ARIA menu in the top layer: focus moves to its first item, ↑/↓/Home/End move, Enter/Space choose,
 * Esc or Tab close and return focus; a click elsewhere, a scroll or a resize closes it. Shift + right-click (and links,
 * fields, media, dialogs, selections) keep the browser's own menu — the provider decides that.
 */
export function ContextMenu({ at, resumeHref, email, onClose }: { at: MenuAt; resumeHref: string | null; email: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const sound = useSave((s) => s.settings.sound);

  const close = (restore = true) => {
    if (restore) at.returnTo?.focus({ preventScroll: true });
    onClose();
  };
  const items: Item[] = [
    {
      id: "copy",
      label: "Copy email",
      icon: "mail",
      run: () =>
        void copy(email).then((ok) =>
          ok ? command({ type: "item", title: "Email", detail: "Copied to the clipboard" }, { type: "achievement", id: "copycat" }) : command({ type: "item", title: "Copy blocked", detail: email }),
        ),
    },
    {
      id: "resume",
      label: resumeHref ? "Download résumé" : "Résumé · coming soon",
      icon: "chest",
      disabled: !resumeHref,
      run: () => {
        if (!resumeHref) return;
        const a = document.createElement("a");
        a.href = resumeHref;
        a.download = "";
        a.click();
        command({ type: "download", what: "resume" });
      },
    },
    { id: "sound", label: sound ? "Turn sound off" : "Turn sound on", icon: sound ? "mute" : "speaker", run: () => useSave.getState().setSetting("sound", !sound) },
    { id: "terminal", label: "Open terminal", icon: "gear", run: () => useUi.getState().setTerminal(true) },
    { id: "locate", label: "Locate cursor", icon: "mouse", run: () => locateCursor() },
    {
      id: "inspect",
      label: "Inspect (you hacker)",
      icon: "bug",
      run: () => {
        printBanner(true);
        command({ type: "item", kicker: "Psst", title: "The console says hi", detail: "Open DevTools (F12, or ⌥⌘I on a Mac) — then try akshat.help()" });
      },
    },
  ];

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    if (typeof menu.showPopover === "function" && !menu.matches(":popover-open")) menu.showPopover();
    // keep it on screen
    const r = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(at.x, innerWidth - r.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(at.y, innerHeight - r.height - 8))}px`;
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus({ preventScroll: true });
    sfx.play("open", { pitch: 1.4 });
    const abort = new AbortController();
    const away = (e: Event) => {
      if (e.target instanceof Node && menu.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("pointerdown", away, { capture: true, signal: abort.signal });
    window.addEventListener("scroll", () => onClose(), { passive: true, signal: abort.signal });
    window.addEventListener("resize", () => onClose(), { signal: abort.signal });
    window.addEventListener("blur", () => onClose(), { signal: abort.signal });
    return () => abort.abort();
  }, [at, onClose]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => list[(n + list.length) % list.length]?.focus();
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") close();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={ref} className="egg-menu" role="menu" aria-label="Game menu" popover="manual" onKeyDown={onKey} data-egg-menu="">
      <p className="egg-menu__title" aria-hidden="true">
        AKSHAT.EXE
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="egg-menu__item"
          aria-disabled={item.disabled || undefined}
          data-menu-item={item.id}
          onClick={() => {
            if (item.disabled) return;
            sfx.play("click");
            close(); // focus back where it was first, so a dialog the item opens returns it there
            item.run();
          }}
        >
          <PixelIcon name={item.icon} size={16} />
          <span>{item.label}</span>
        </button>
      ))}
      <p className="egg-menu__hint" aria-hidden="true">
        Shift + right-click: the browser&apos;s menu
      </p>
    </div>
  );
}
