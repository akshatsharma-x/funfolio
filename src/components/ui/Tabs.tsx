"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sfx } from "@/lib/sfx";
import { PixelIcon, type PixelIconName } from "./PixelIcon";

export type TabItem = { id: string; label: ReactNode; content: ReactNode; icon?: PixelIconName };

type TabsProps = {
  tabs: TabItem[];
  /** Accessible name of the tab list. */
  label: string;
  defaultTab?: string;
  /** Controlled mode: the selected tab id (pair with onChange). */
  value?: string;
  onChange?: (id: string) => void;
  /** vertical = side menu (pause menu); arrows follow the orientation. */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/**
 * WAI-ARIA tabs with a sliding pixel underline. Arrow keys / Home / End move and select. Inactive panels stay in the
 * DOM (hidden), so their content is still server-rendered for SEO and assistive tech (R3).
 */
export function Tabs({ tabs, label, defaultTab, value, onChange, orientation = "horizontal", className }: TabsProps) {
  const base = useId();
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id);
  const active = value ?? internal;
  const vertical = orientation === "vertical";
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const select = (id: string, focus = false) => {
    if (id !== active) sfx.play("blip");
    setInternal(id);
    onChange?.(id);
    if (focus) document.getElementById(`${base}-tab-${id}`)?.focus();
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab) return;
      bar.style.setProperty("--tab-x", `${tab.offsetLeft}px`);
      bar.style.setProperty("--tab-w", `${tab.offsetWidth}px`);
      bar.style.setProperty("--tab-y", `${tab.offsetTop}px`);
      bar.style.setProperty("--tab-h", `${tab.offsetHeight}px`);
      // enable the slide only after the first placement (no slide-in on load)
      requestAnimationFrame(() => bar.setAttribute("data-ready", ""));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    const backward = vertical ? "ArrowUp" : "ArrowLeft";
    if (e.key === forward) next = (i + 1) % tabs.length;
    else if (e.key === backward) next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next].id, true);
  };

  return (
    <div className={cn("tabs", className)} data-orientation={orientation}>
      <div ref={listRef} role="tablist" aria-label={label} aria-orientation={orientation} className="tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              id={`${base}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              className="tabs__tab"
              onClick={() => select(t.id)}
            >
              {t.icon ? <PixelIcon name={t.icon} mono /> : null}
              {t.label}
            </button>
          );
        })}
        <span ref={barRef} className="tabs__indicator" aria-hidden="true" />
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="tabs__panel"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
