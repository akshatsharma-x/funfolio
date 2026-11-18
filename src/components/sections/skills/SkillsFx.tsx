"use client";

import { useEffect } from "react";
import { announce } from "@/lib/announce";
import { bus } from "@/lib/bus";
import { byte } from "@/lib/byte";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { fx } from "@/lib/juice";
import { scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { makeScanner, SAMPLE_JD, searchSkills, type ScanResult, type SkillsIndex } from "@/lib/skills-index";

type Tab = "tree" | "inventory" | "jd";
const TABS: readonly Tab[] = ["tree", "inventory", "jd"];
const INSPECT_MS = 350; // a card counts as inspected once it has been open this long
const INSPECTIONS = 10; // distinct skills → Skill Issue? Nope.
const KNOCK_MS = 450; // two activations of the root within this → coin #10
const LOADOUT = 3;
const SWEEP_MS = 1300;
const NOTES = [1, 1.125, 1.25, 1.5, 1.6875];

const isTab = (v: string | undefined): v is Tab => !!v && (TABS as readonly string[]).includes(v);
const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
  const node = document.createElement(tag);
  node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

/**
 * The Skill Tree's island (PART 13), on server-rendered DOM (one delegated island, no per-node hydration):
 *  • tabs: TREE · INVENTORY · JD SCANNER (ARIA tabs: ←/→, Home/End, automatic activation);
 *  • tree: node triggers become buttons with one tab stop (arrows move in 2D, PageUp/PageDown between branches,
 *    Home = the root); cards open on hover, focus or tap, Esc closes; 10 skills inspected → skill-issue-nope; the root
 *    knocked twice → coin #10; dings when the branches grow; "Used in" links scroll to the quest (and flash it) or
 *    insert the project's cartridge in the Vault; any `#skill-…` link lands on its node;
 *  • inventory: type filters, alias-aware search, a roving grid, the loadout (3 slots) and its combos;
 *  • JD scanner: laser sweep + beeps, then the results, the inventory lit up, perfect-match — all in the browser.
 */
export function SkillsFx({ index }: { index: SkillsIndex }) {
  useEffect(() => {
    const section = document.getElementById("skills");
    if (!section) return;
    const html = document.documentElement;
    const abort = new AbortController();
    const on = { signal: abort.signal };
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };
    const cancel = (t: number | undefined) => {
      if (t === undefined) return;
      window.clearTimeout(t);
      timers.delete(t);
    };
    const reduced = () => prefersReducedMotion();
    const playMode = () => html.getAttribute("data-mode") !== "speedrun";
    const shown = (node: Element) => node.getClientRects().length > 0;
    const center = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    };
    const flash = (node: Element | null) => {
      if (!node) return;
      node.setAttribute("data-flash", "");
      later(() => node.removeAttribute("data-flash"), 1700);
    };

    // ── elements ──────────────────────────────────────────────────────────────────────────────────────────────────
    const box = section.querySelector<HTMLElement>("[data-skills]") ?? section;
    const tabBtns = [...section.querySelectorAll<HTMLButtonElement>("[data-skills-tab]")];
    const tablist = section.querySelector<HTMLElement>(".skills-tabs");
    const panelOf = (t: Tab) => section.querySelector<HTMLElement>(`[data-panel="${t}"]`);
    const tree = section.querySelector<HTMLElement>(".sk-tree");
    const nodes = [...section.querySelectorAll<HTMLElement>(".sk-node")];
    const triggers = nodes.map((li) => li.querySelector<HTMLElement>("[data-node]")).filter((t): t is HTMLElement => !!t);
    const rootBtn = section.querySelector<HTMLButtonElement>("[data-sk-root]");
    const grid = section.querySelector<HTMLElement>("[data-inv-grid]");
    const slotBtns = [...section.querySelectorAll<HTMLButtonElement>("[data-slot-btn]")];
    const filterBtns = [...section.querySelectorAll<HTMLButtonElement>("[data-inv-filter]")];
    const search = section.querySelector<HTMLInputElement>("[data-inv-search]");
    const invStatus = section.querySelector<HTMLElement>("[data-inv-status]");
    const detail = section.querySelector<HTMLElement>("[data-inv-detail]");
    const loadoutSlots = [...section.querySelectorAll<HTMLElement>("[data-loadout-slot]")];
    const comboEl = section.querySelector<HTMLElement>("[data-combo]");
    const clearLoadout = section.querySelector<HTMLButtonElement>("[data-loadout-clear]");
    const jdBanner = section.querySelector<HTMLElement>("[data-inv-jd]");
    const jdForm = section.querySelector<HTMLFormElement>("[data-jd-form]");
    const jdText = section.querySelector<HTMLTextAreaElement>("[data-jd-text]");
    const scanBtn = section.querySelector<HTMLButtonElement>("[data-jd-scan]");
    const laser = section.querySelector<HTMLElement>("[data-jd-laser]");
    const jdStatus = section.querySelector<HTMLElement>("[data-jd-status]");
    const results = section.querySelector<HTMLElement>("[data-jd-results]");
    const showBtn = section.querySelector<HTMLButtonElement>("[data-jd-show]");

    const toneOf = (i: number) => index.types[index.skills[i]?.type ?? 0]?.tone ?? "yellow";
    // icons built at run time (scan tiles, the loadout) use the inline item-type sprite, never the logo file: they must
    // draw offline too, and WebKit re-requests an external <use> for every new element
    const iconOf = (i: number) => {
      const pixel = section.querySelector<HTMLElement>(`[data-type="${index.types[index.skills[i]?.type ?? 0]?.id}"] .sk-hub__icon svg`);
      const box = el("span", "inv-slot__icon");
      box.setAttribute("aria-hidden", "true");
      if (pixel) box.append(pixel.cloneNode(true));
      return box;
    };
    const triggerOf = (li: Element) => li.querySelector<HTMLElement>("[data-node]");
    const skillOf = (node: Element) => Number((node.closest("[data-skill]") as HTMLElement | null)?.dataset.skill ?? -1);

    // ── inspections (tree cards + inventory details; distinct skills) ─────────────────────────────────────────────
    const inspected = new Set<number>();
    const pending = new Map<number, number>();
    const inspect = (i: number) => {
      if (i < 0 || inspected.has(i) || pending.has(i)) return;
      pending.set(
        i,
        later(() => {
          pending.delete(i);
          inspected.add(i);
          if (inspected.size === INSPECTIONS) command({ type: "achievement", id: "skill-issue-nope" });
        }, INSPECT_MS),
      );
    };
    const uninspect = (i: number) => {
      cancel(pending.get(i));
      pending.delete(i);
    };

    // ── inventory marks from the last scan (declared before the tabs, which bounce them) ──────────────────────────
    let bouncePending = false;
    const bounceMatches = () => {
      if (!bouncePending || !grid) return;
      bouncePending = false;
      if (reduced()) return;
      grid.setAttribute("data-bounce", "");
      later(() => grid.removeAttribute("data-bounce"), 1800);
    };

    // ── tabs ──────────────────────────────────────────────────────────────────────────────────────────────────────
    let view: Tab = "tree";
    const select = (t: Tab) => {
      const changed = t !== view;
      view = t;
      for (const b of tabBtns) {
        const selected = b.dataset.skillsTab === t;
        b.setAttribute("aria-selected", String(selected));
        b.tabIndex = selected ? 0 : -1;
      }
      for (const p of TABS) panelOf(p)?.toggleAttribute("data-active", p === t);
      if (!changed) return;
      sfx.play("blip", { pitch: 1 + TABS.indexOf(t) * 0.18 });
      if (t === "inventory") bounceMatches();
    };
    tablist?.addEventListener(
      "click",
      (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>("[data-skills-tab]");
        if (!b || !isTab(b.dataset.skillsTab)) return;
        if (document.activeElement !== b) b.focus({ preventScroll: true }); // Safari doesn't focus clicked buttons
        select(b.dataset.skillsTab);
      },
      on,
    );
    tablist?.addEventListener(
      "keydown",
      (e) => {
        const i = tabBtns.indexOf(document.activeElement as HTMLButtonElement);
        if (i < 0) return;
        const j = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabBtns.length - 1 } as Record<string, number>)[e.key];
        if (j === undefined) return;
        e.preventDefault();
        const next = tabBtns[(j + tabBtns.length) % tabBtns.length];
        next.focus();
        if (isTab(next.dataset.skillsTab)) select(next.dataset.skillsTab);
      },
      on,
    );

    // ── tree: one tab stop, 2D arrows ─────────────────────────────────────────────────────────────────────────────
    for (const t of triggers) {
      t.setAttribute("role", "button");
      t.tabIndex = -1;
    }
    const allStops: HTMLElement[] = [...(rootBtn ? [rootBtn] : []), ...triggers];
    const stops = () => allStops.filter(shown);
    const setStop = (stop: HTMLElement | undefined) => {
      if (!stop) return;
      for (const s of allStops) s.tabIndex = s === stop ? 0 : -1;
    };
    const fixStop = () => {
      const current = allStops.find((s) => s.tabIndex === 0);
      if (!current || !shown(current)) setStop(stops()[0]);
    };
    setStop(stops()[0] ?? allStops[0]);

    const anchorPoint = (stop: HTMLElement) => center(stop.querySelector(".sk-hex, .sk-root__hex") ?? stop);
    const branchOf = (stop: HTMLElement) => stop.closest(".sk-branch");
    const step = (from: HTMLElement, key: string): HTMLElement | null => {
      const list = stops();
      const i = list.indexOf(from);
      if (key === "Home") return list[0] ?? null;
      if (key === "End") return list[list.length - 1] ?? null;
      if (key === "PageDown" || key === "PageUp") {
        const branches = [...new Set(list.map(branchOf).filter((b): b is Element => !!b))];
        const at = branches.indexOf(branchOf(from) as Element);
        const target = branches[at < 0 ? 0 : (at + (key === "PageDown" ? 1 : -1) + branches.length) % branches.length];
        return list.find((s) => branchOf(s) === target) ?? null;
      }
      const d = ({ ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] } as Record<string, [number, number]>)[key];
      if (!d) return null;
      const a = anchorPoint(from);
      let best: HTMLElement | null = null;
      let score = Infinity;
      for (const s of list) {
        if (s === from) continue;
        const b = anchorPoint(s);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const along = dx * d[0] + dy * d[1];
        if (along < 4) continue;
        const across = Math.abs(dx * d[1]) + Math.abs(dy * d[0]);
        if (across > along * 2.5) continue; // inside a ~68° cone
        const sc = along + across * 2;
        if (sc < score) {
          score = sc;
          best = s;
        }
      }
      // nothing that way (a list layout, an edge of the tree): fall back to reading order
      return best ?? (d[0] + d[1] > 0 ? list[i + 1] : list[i - 1]) ?? null;
    };

    // ── tree: cards ───────────────────────────────────────────────────────────────────────────────────────────────
    /** Keep a floating card on screen: shift it sideways, or open it above the node near the bottom of the window. */
    const place = (li: HTMLElement) => {
      const card = li.querySelector<HTMLElement>(".sk-card");
      if (!card || getComputedStyle(card).position !== "absolute") return; // the plain list shows cards inline
      card.style.removeProperty("--cx");
      li.removeAttribute("data-flip");
      const r = card.getBoundingClientRect();
      const dx = r.left < 8 ? 8 - r.left : r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : 0;
      if (dx) card.style.setProperty("--cx", `${Math.round(dx)}px`);
      const hexTop = (li.querySelector(".sk-hex") ?? li).getBoundingClientRect().top;
      if (r.bottom > window.innerHeight - 8 && hexTop - r.height - 12 > 72) li.setAttribute("data-flip", "");
      byte.recheck(); // the card's links appear without a scroll: BYTE steps off them
    };
    // a floating card that is showing (in the plain list cards are inline and always shown: Esc there is the pause menu's)
    const open = (li: HTMLElement) => {
      const card = li.querySelector<HTMLElement>(".sk-card");
      if (!card || getComputedStyle(card).position !== "absolute") return false;
      return !li.hasAttribute("data-dismissed") && (li.hasAttribute("data-open") || li.matches(":hover") || li.contains(document.activeElement));
    };
    const dismiss = (li: HTMLElement) => {
      li.setAttribute("data-dismissed", "");
      li.removeAttribute("data-open");
    };
    const pin = (li: HTMLElement) => {
      const pinned = li.hasAttribute("data-open");
      for (const n of nodes) n.removeAttribute("data-open");
      li.removeAttribute("data-dismissed");
      if (pinned) return;
      li.setAttribute("data-open", "");
      place(li);
      inspect(skillOf(li));
      sfx.play("pop");
    };

    let hovered: HTMLElement | null = null;
    tree?.addEventListener(
      "pointerover",
      (e) => {
        const li = (e.target as Element).closest<HTMLElement>(".sk-node");
        if (!li || li === hovered) return;
        if (hovered) {
          hovered.removeAttribute("data-dismissed");
          uninspect(skillOf(hovered));
        }
        hovered = li;
        place(li);
        inspect(skillOf(li));
      },
      on,
    );
    tree?.addEventListener(
      "pointerout",
      (e) => {
        if (!hovered || hovered.contains(e.relatedTarget as Node | null)) return;
        hovered.removeAttribute("data-dismissed");
        if (!hovered.hasAttribute("data-open") && !hovered.contains(document.activeElement)) uninspect(skillOf(hovered));
        hovered = null;
      },
      on,
    );
    tree?.addEventListener(
      "focusin",
      (e) => {
        const t = (e.target as Element).closest<HTMLElement>("[data-node], [data-sk-root]");
        if (t) setStop(t);
        const li = (e.target as Element).closest<HTMLElement>(".sk-node");
        if (!li || li.contains(e.relatedTarget as Node | null)) return;
        place(li);
        inspect(skillOf(li));
      },
      on,
    );
    tree?.addEventListener(
      "focusout",
      (e) => {
        const li = (e.target as Element).closest<HTMLElement>(".sk-node");
        if (!li || li.contains(e.relatedTarget as Node | null)) return;
        li.removeAttribute("data-dismissed");
        li.removeAttribute("data-open");
        if (li !== hovered) uninspect(skillOf(li));
      },
      on,
    );
    tree?.addEventListener(
      "click",
      (e) => {
        const t = (e.target as Element).closest<HTMLElement>("[data-node]");
        const li = t?.closest<HTMLElement>(".sk-node");
        if (!t || !li) return;
        if (document.activeElement !== t) t.focus({ preventScroll: true });
        pin(li);
      },
      on,
    );
    tree?.addEventListener(
      "keydown",
      (e) => {
        const target = e.target as Element;
        const li = target.closest<HTMLElement>(".sk-node");
        if (e.key === "Escape") {
          // WCAG 1.4.13: the card goes away without moving the pointer or focus — before the pause menu (#114)
          if (li && open(li)) {
            e.preventDefault();
            dismiss(li);
            if (!target.matches("[data-node]")) triggerOf(li)?.focus();
          }
          return;
        }
        const stop = target.closest<HTMLElement>("[data-node], [data-sk-root]");
        if (!stop) return;
        if (stop.matches("[data-node]") && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          if (li) pin(li);
          return;
        }
        const next = step(stop, e.key);
        if (!next) return;
        e.preventDefault();
        setStop(next);
        next.focus();
      },
      on,
    );
    document.addEventListener(
      "pointerdown",
      (e) => {
        const inside = e.target instanceof Element ? e.target.closest(".sk-node") : null;
        for (const n of nodes) if (n !== inside) n.removeAttribute("data-open");
      },
      on,
    );

    // the root: knock twice → coin #10 (two Enters, two clicks or a double tap)
    let knock = 0;
    rootBtn?.addEventListener(
      "click",
      () => {
        const now = performance.now();
        const hex = rootBtn.querySelector(".sk-root__hex");
        if (now - knock < KNOCK_MS) {
          knock = 0;
          command({ type: "coin", id: "skill-root", origin: center(rootBtn) });
          if (!reduced()) hex?.animate([{ transform: "scale(1) rotate(0deg)" }, { transform: "scale(1.18) rotate(-8deg)" }, { transform: "scale(1) rotate(0deg)" }], { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" });
          return;
        }
        knock = now;
        sfx.play("pop", { pitch: 0.8 });
        if (!reduced()) hex?.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 240, easing: "cubic-bezier(.3,1.6,.5,1)" });
      },
      on,
    );

    // the branches grow (PlayOnView: armed → run): one rising ding per branch
    const playWatch = new MutationObserver(() => {
      if (tree?.dataset.play !== "run") return;
      playWatch.disconnect();
      section.querySelectorAll(".sk-branch").forEach((_, b) => later(() => sfx.play("note", { pitch: NOTES[b % NOTES.length] }), 230 + b * 95));
      // the nodes popped in from scale 0 (BYTE measured them as nothing): once they've landed, BYTE re-checks its spot
      later(() => byte.recheck(), 1500);
    });
    if (tree) playWatch.observe(tree, { attributes: true, attributeFilter: ["data-play"] });

    // ── navigation: "Used in" links, #skill-… links, deep links, the JD side quest ────────────────────────────────
    const goQuest = (id: string) => {
      const head = document.getElementById(`quest-${id}`);
      if (!head) return false;
      history.pushState(null, "", `#quest-${id}`);
      scrollToElement(head, { focus: true, onComplete: () => flash(head.closest("[data-quest-card]")) });
      return true;
    };
    const goProject = (id: string) => {
      const vault = document.getElementById("vault");
      if (!vault || !document.querySelector(`[data-cart-slot="${id}"]`)) return false;
      history.pushState(null, "", "#vault");
      scrollToElement(vault, { onComplete: () => bus.emit("vault:insert", { id }) });
      return true;
    };
    section.addEventListener(
      "click",
      (e) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>("a.sk-ev");
        if (!a || !plainClick(e) || !playMode()) return; // Speedrun Mode: plain anchors to the plain lists
        const id = a.dataset.evId ?? "";
        if (a.dataset.ev === "quest" ? goQuest(id) : goProject(id)) e.preventDefault();
      },
      on,
    );

    const landOn = (li: HTMLElement) => {
      select("tree");
      const t = triggerOf(li);
      scrollToElement(li, {
        block: "center",
        onComplete: () => {
          if (t) {
            setStop(t);
            t.focus({ preventScroll: true });
          }
          place(li);
          flash(li);
        },
      });
    };
    // any loot link (Quest Log, Vault) → its node, in Play Mode; captured before the Quest Log's own handler
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#skill-"]') : null;
        if (!a || !plainClick(e) || !playMode()) return;
        const li = document.getElementById(decodeURIComponent(a.hash.slice(1)));
        if (!li?.classList.contains("sk-node")) return;
        e.preventDefault();
        e.stopPropagation();
        history.pushState(null, "", a.hash);
        landOn(li);
      },
      { capture: true, signal: abort.signal },
    );
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const tab = h.startsWith("skills-") ? h.slice(7) : "";
      if (isTab(tab)) {
        // the hidden panel couldn't take the browser's own jump; an instant one keeps scroll anchoring on our side
        // while content above still settles (a smooth scroll would aim at where the box was)
        select(tab);
        box.scrollIntoView({ block: "start" });
      } else if (h.startsWith("skill-")) {
        const li = document.getElementById(h);
        if (li?.classList.contains("sk-node")) {
          select("tree");
          flash(li);
        }
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash, on);

    // ── inventory ─────────────────────────────────────────────────────────────────────────────────────────────────
    const slotLi = (b: HTMLElement) => b.parentElement as HTMLElement;
    const visibleSlots = () => slotBtns.filter((b) => !slotLi(b).hasAttribute("data-out"));
    const setInvStop = (b: HTMLButtonElement | undefined) => {
      if (!b) return;
      for (const s of slotBtns) s.tabIndex = s === b ? 0 : -1;
    };
    const fixInvStop = () => {
      const list = visibleSlots();
      if (!list.some((b) => b.tabIndex === 0)) setInvStop(list[0]);
    };
    const columns = (list: HTMLElement[]) => {
      const top = list[0] ? slotLi(list[0]).offsetTop : 0;
      let n = 0;
      for (const b of list) {
        if (slotLi(b).offsetTop !== top) break;
        n++;
      }
      return Math.max(1, n);
    };
    let statusTimer: number | undefined;
    const say = (text: string, ms = 450) => {
      cancel(statusTimer);
      statusTimer = later(() => {
        if (invStatus) invStatus.textContent = text;
      }, ms);
    };
    const applyFilter = (id: string) => {
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.invFilter === id)));
      slotBtns.forEach((b, i) => slotLi(b).toggleAttribute("data-out", id !== "all" && index.types[index.skills[i]?.type ?? -1]?.id !== id));
      grid?.toggleAttribute("data-filtered", id !== "all");
      fixInvStop();
      const n = visibleSlots().length;
      say(id === "all" ? `All ${n} skills shown.` : `${n} ${filterBtns.find((b) => b.dataset.invFilter === id)?.textContent?.replace(/\s*\d+$/, "").trim() ?? ""} shown.`, 0);
    };
    filterBtns.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.invFilter ?? "all"), on));

    let hits = new Set<number>();
    const runSearch = () => {
      const q = search?.value.trim() ?? "";
      hits = searchSkills(index, q);
      slotBtns.forEach((b, i) => {
        slotLi(b).toggleAttribute("data-hit", !!q && hits.has(i));
        slotLi(b).toggleAttribute("data-miss", !!q && !hits.has(i));
      });
      grid?.toggleAttribute("data-searching", !!q);
      say(!q ? "" : hits.size ? `${hits.size} match${hits.size === 1 ? "" : "es"} for “${q}”.` : `No matches for “${q}” — try another spelling.`);
    };
    search?.addEventListener("input", runSearch, on);
    search?.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const first = visibleSlots().find((b) => hits.has(Number(b.dataset.slotBtn)));
        if (!first) return;
        setInvStop(first);
        first.focus();
      },
      on,
    );
    grid?.addEventListener(
      "keydown",
      (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>("[data-slot-btn]");
        if (!b) return;
        const list = visibleSlots();
        const i = list.indexOf(b);
        if (i < 0) return;
        const c = columns(list);
        const j = ({ ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + c, ArrowUp: i - c, Home: 0, End: list.length - 1 } as Record<string, number>)[e.key];
        if (j === undefined) return;
        e.preventDefault();
        const k = Math.min(list.length - 1, Math.max(0, j));
        setInvStop(list[k]);
        list[k].focus();
      },
      on,
    );

    // item details: a visual copy of the skill's card (screen readers get the card itself as the slot's description)
    const showDetail = (i: number) => {
      const card = document.getElementById(`${slotBtns[i]?.getAttribute("aria-describedby") ?? ""}`);
      if (!card || !detail) return;
      const copy = card.cloneNode(true) as HTMLElement;
      copy.removeAttribute("id");
      copy.className = "inv-detail__card";
      copy.querySelectorAll("a").forEach((a) => a.replaceWith(el("span", a.className, a.textContent ?? "")));
      detail.dataset.tone = toneOf(i);
      detail.replaceChildren(copy);
    };
    let inspectingSlot = -1;
    const slotIn = (e: Event) => {
      const b = (e.target as Element).closest<HTMLButtonElement>("[data-slot-btn]");
      if (!b) return;
      const i = Number(b.dataset.slotBtn);
      if (i === inspectingSlot) return;
      if (inspectingSlot >= 0) uninspect(inspectingSlot);
      inspectingSlot = i;
      showDetail(i);
      inspect(i);
      if (e.type === "focusin") setInvStop(b);
    };
    grid?.addEventListener("pointerover", slotIn, on);
    grid?.addEventListener("focusin", slotIn, on);
    grid?.addEventListener(
      "pointerleave",
      () => {
        if (inspectingSlot >= 0 && !grid.contains(document.activeElement)) uninspect(inspectingSlot);
        inspectingSlot = -1;
      },
      on,
    );

    // the loadout: three slots; a fourth equip replaces the oldest
    const equipped: number[] = [];
    const nameOf = (i: number) => index.skills[i]?.name ?? "";
    const entryLink = (e: number) => {
      const en = index.entries[e];
      const a = el("a", "sk-ev", en.name);
      a.href = en.kind === "quest" ? `#quest-${en.id}` : `#screen-${en.id}`;
      a.dataset.ev = en.kind;
      a.dataset.evId = en.id;
      return a;
    };
    const together = (ids: number[]) =>
      ids.map((i) => new Set(index.skills[i]?.ev ?? [])).reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
    const renderLoadout = () => {
      loadoutSlots.forEach((li, k) => {
        const i = equipped[k];
        li.replaceChildren();
        if (i === undefined) {
          delete li.dataset.tone;
          li.removeAttribute("data-full");
          li.append(el("span", "loadout-slot__empty", `Empty slot ${k + 1}`));
          return;
        }
        li.dataset.tone = toneOf(i);
        li.setAttribute("data-full", "");
        const b = el("button", "loadout-slot__btn");
        b.type = "button";
        b.dataset.unequip = String(i);
        const icon = iconOf(i);
        if (icon) b.append(icon);
        b.append(el("span", "loadout-slot__name", nameOf(i)), el("span", "sr-only", " — unequip"));
        li.append(b);
      });
      slotBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(equipped.includes(i))));
      if (clearLoadout) clearLoadout.hidden = equipped.length === 0;
    };
    const renderCombo = (fresh: boolean) => {
      if (!comboEl) return;
      comboEl.replaceChildren();
      delete comboEl.dataset.state;
      const line = (cls: string, text?: string) => comboEl.appendChild(el("p", cls, text));
      if (equipped.length < 2) {
        line("combo__idle", equipped.length ? "Equip one more skill to look for a combo." : "Equip two skills to look for a combo.");
        return;
      }
      const names = equipped.map(nameOf).join(" + ");
      const hit = [...together(equipped)];
      if (hit.length) {
        comboEl.dataset.state = "combo";
        line("combo__kicker", "COMBO!");
        const p = line("combo__line");
        p.append(`${names} → `);
        hit.forEach((e, k) => p.append(...(k ? [", ", entryLink(e)] : [entryLink(e)])));
        if (!fresh) return;
        sfx.play("powerUp");
        const last = loadoutSlots[equipped.length - 1];
        if (last && !reduced()) {
          const c = center(last);
          fx.burst(c.x, c.y - 18, { shape: "star", colors: ["#FFD23F", "#FFF1A8", "#FFC83D"] });
        }
        announce(`Combo! ${names}: used together in ${hit.map((e) => index.entries[e]?.name).join(", ")}.`);
        return;
      }
      comboEl.dataset.state = "untested";
      line("combo__kicker", "Untested combo");
      line("combo__line", "Akshat's down to try 😄");
      if (equipped.length === LOADOUT) {
        const near = [
          [0, 1],
          [0, 2],
          [1, 2],
        ]
          .map(([a, b]) => ({ pair: [equipped[a], equipped[b]], at: [...together([equipped[a], equipped[b]])] }))
          .filter((p) => p.at.length);
        if (near.length) {
          const p = line("combo__near");
          p.append("Closest: ");
          near.forEach((n, k) => {
            if (k) p.append(" · ");
            p.append(`${n.pair.map(nameOf).join(" + ")} → `);
            n.at.forEach((e, m) => p.append(...(m ? [", ", entryLink(e)] : [entryLink(e)])));
          });
        }
      }
      if (fresh) {
        sfx.play("blip", { pitch: 0.7 });
        announce(`Untested combo: ${names}. Akshat's down to try.`);
      }
    };
    const toggleEquip = (i: number) => {
      const k = equipped.indexOf(i);
      if (k >= 0) {
        equipped.splice(k, 1);
        sfx.play("close");
        announce(`${nameOf(i)} unequipped.`);
      } else {
        const out = equipped.length === LOADOUT ? equipped.shift() : undefined;
        equipped.push(i);
        sfx.play("click", { pitch: 1.2 });
        if (equipped.length < 2) announce(`${nameOf(i)} equipped${out !== undefined ? `, ${nameOf(out)} unequipped` : ""}.`);
      }
      renderLoadout();
      renderCombo(k < 0);
    };
    grid?.addEventListener(
      "click",
      (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>("[data-slot-btn]");
        if (!b) return;
        if (document.activeElement !== b) b.focus({ preventScroll: true });
        toggleEquip(Number(b.dataset.slotBtn));
      },
      on,
    );
    section.querySelector("[data-loadout]")?.addEventListener(
      "click",
      (e) => {
        const b = (e.target as Element).closest<HTMLButtonElement>("[data-unequip]");
        if (!b) return;
        const i = Number(b.dataset.unequip);
        toggleEquip(i);
        // the button is gone: keep focus nearby — the next equipped skill, or the slot in the grid
        const next = section.querySelector<HTMLButtonElement>("[data-unequip]") ?? slotBtns[i];
        next?.focus({ preventScroll: true });
      },
      on,
    );
    clearLoadout?.addEventListener(
      "click",
      () => {
        const first = equipped[0];
        equipped.length = 0;
        renderLoadout();
        renderCombo(false);
        sfx.play("close");
        announce("Loadout cleared.");
        (first !== undefined ? slotBtns[first] : visibleSlots()[0])?.focus();
      },
      on,
    );

    // ── JD scanner ────────────────────────────────────────────────────────────────────────────────────────────────
    const scan = makeScanner(index);
    let scanning = false;
    const markInventory = (r: ScanResult | null) => {
      const match = new Set(r?.matched ?? []);
      const bonus = new Set((r?.bonus ?? []).map((b) => b.skill));
      let k = 0;
      slotBtns.forEach((b, i) => {
        const li = slotLi(b);
        li.toggleAttribute("data-jd-match", match.has(i));
        li.toggleAttribute("data-jd-bonus", bonus.has(i));
        if (match.has(i) || bonus.has(i)) li.style.setProperty("--k", String(k++));
        else li.style.removeProperty("--k");
      });
      const lit = match.size + bonus.size;
      if (jdBanner) {
        jdBanner.hidden = !r || lit === 0;
        const text = jdBanner.querySelector("[data-inv-jd-text]");
        if (text) text.textContent = `Lit up by your last JD scan: ${match.size} matching skill${match.size === 1 ? "" : "s"}${bonus.size ? ` + ${bonus.size} bonus perk${bonus.size === 1 ? "" : "s"}` : ""}.`;
      }
      bouncePending = lit > 0;
    };
    const tile = (i: number, k: number, via?: string) => {
      const li = el("li", "jd-tile");
      li.dataset.tone = toneOf(i);
      li.style.setProperty("--i", String(k));
      const icon = iconOf(i);
      if (icon) li.append(icon);
      li.append(el("span", "jd-tile__name", nameOf(i)));
      if (via) li.append(" ", el("span", "jd-tile__via", `for “${via}”`));
      return li;
    };
    const fillPart = (part: string, items: Node[]) => {
      const sec = results?.querySelector<HTMLElement>(`[data-jd-part="${part}"]`);
      if (!sec) return;
      sec.hidden = items.length === 0;
      const n = sec.querySelector("[data-jd-n]");
      if (n) n.textContent = String(items.length);
      sec.querySelector("[data-jd-list]")?.replaceChildren(...items);
    };
    const render = (r: ScanResult) => {
      if (!results) return;
      results.hidden = false;
      const n = r.matched.length;
      const title = results.querySelector("[data-jd-title]");
      if (title) title.textContent = `${n} matching skill${n === 1 ? "" : "s"}`;
      let k = 0;
      results.querySelectorAll<HTMLElement>("[data-jd-group]").forEach((g) => {
        const t = index.types.findIndex((x) => x.id === g.dataset.jdGroup);
        const mine = r.matched.filter((i) => index.skills[i]?.type === t);
        g.hidden = mine.length === 0;
        const count = g.querySelector("[data-jd-n]");
        if (count) count.textContent = String(mine.length);
        g.querySelector("[data-jd-list]")?.replaceChildren(...mine.map((i) => tile(i, k++)));
      });
      fillPart(
        "bonus",
        r.bonus.map((b) => tile(b.skill, k++, b.via)),
      );
      fillPart(
        "extras",
        r.extras.map((x) => {
          const extra = index.extras[x.extra];
          const li = el("li", "jd-list__item");
          li.append(el("span", "jd-list__name", extra?.name ?? x.via), el("span", "jd-list__src", ` — ${extra?.source ?? ""}`));
          return li;
        }),
      );
      fillPart(
        "missing",
        r.missing.map((m) => el("li", "chip jd-chip", index.vocab[m.vocab]?.name ?? m.via)),
      );
      const nothing = n + r.bonus.length + r.extras.length + r.missing.length === 0;
      const empty = results.querySelector<HTMLElement>("[data-jd-empty]");
      if (empty) empty.hidden = !nothing;
      if (showBtn) showBtn.hidden = n + r.bonus.length === 0;
    };
    const sweep = () =>
      new Promise<void>((resolve) => {
        const paper = laser?.parentElement;
        if (!laser || !paper || reduced()) {
          sfx.play("blip", { pitch: 1.4 });
          later(resolve, 220);
          return;
        }
        const h = Math.max(0, paper.clientHeight - 4);
        const anim = laser.animate([{ transform: "translateY(0)" }, { transform: `translateY(${h}px)` }, { transform: "translateY(0)" }], { duration: SWEEP_MS, easing: "ease-in-out" });
        for (let b = 0; b < 8; b++) later(() => sfx.play("blip", { pitch: 0.9 + b * 0.14 }), b * 160);
        anim.onfinish = () => resolve();
        anim.oncancel = () => resolve();
      });
    const runScan = async () => {
      if (scanning || !jdText || !jdForm) return;
      const text = jdText.value.trim();
      if (!text) {
        sfx.play("error");
        if (jdStatus) jdStatus.textContent = "Paste a job description first — or try the sample.";
        jdText.focus();
        return;
      }
      scanning = true;
      jdForm.setAttribute("data-scanning", "");
      scanBtn?.setAttribute("aria-disabled", "true");
      if (jdStatus) jdStatus.textContent = "Scanning…";
      const r = scan(text);
      await sweep();
      if (abort.signal.aborted) return;
      render(r);
      markInventory(r);
      jdForm.removeAttribute("data-scanning");
      scanBtn?.removeAttribute("aria-disabled");
      scanning = false;
      const parts = [
        `${r.matched.length} matching skill${r.matched.length === 1 ? "" : "s"}`,
        r.bonus.length ? `${r.bonus.length} bonus perk${r.bonus.length === 1 ? "" : "s"}` : "",
        r.extras.length ? `${r.extras.length} more on the résumé` : "",
        r.missing.length ? `${r.missing.length} not on the save file yet` : "",
      ].filter(Boolean);
      if (jdStatus) jdStatus.textContent = `Scan complete: ${parts.join(", ")}.`;
      announce(`Scan complete: ${parts.join(", ")}.`);
      sfx.play(r.matched.length + r.bonus.length ? "fanfare" : "blip");
      command({ type: "achievement", id: "perfect-match" });
    };
    jdForm?.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        void runScan();
      },
      on,
    );
    section.querySelector("[data-jd-sample]")?.addEventListener(
      "click",
      () => {
        if (!jdText || scanning) return;
        jdText.value = SAMPLE_JD;
        jdText.scrollTop = 0;
        void runScan();
      },
      on,
    );
    section.querySelector("[data-jd-clear]")?.addEventListener(
      "click",
      () => {
        if (!jdText || scanning) return;
        jdText.value = "";
        if (results) results.hidden = true;
        if (jdStatus) jdStatus.textContent = "";
        markInventory(null);
        jdText.focus();
      },
      on,
    );
    const clearMarks = () => {
      markInventory(null);
      visibleSlots()[0]?.focus();
    };
    section.querySelector("[data-inv-jd-clear]")?.addEventListener("click", clearMarks, on);
    showBtn?.addEventListener(
      "click",
      () => {
        select("inventory");
        const first = visibleSlots().find((b) => slotLi(b).hasAttribute("data-jd-match") || slotLi(b).hasAttribute("data-jd-bonus"));
        scrollToElement(box, {
          onComplete: () => {
            if (!first) return;
            setInvStop(first);
            first.focus({ preventScroll: true });
          },
        });
      },
      on,
    );

    // the JD Scanner side quest (the Vault's Resume Screener; openGame("jd-scanner") in the runtime)
    const offOpen = bus.on("skills:open", ({ tab }) => {
      select(tab);
      scrollToElement(box, {
        onComplete: () => {
          const target = tab === "jd" ? jdText : tab === "inventory" ? visibleSlots().find((b) => b.tabIndex === 0) : stops().find((s) => s.tabIndex === 0);
          target?.focus({ preventScroll: true });
        },
      });
    });

    // Speedrun Mode hides the root and the plain list replaces the map: keep the tree's tab stop on something visible
    const modeWatch = new MutationObserver(fixStop);
    modeWatch.observe(html, { attributes: true, attributeFilter: ["data-mode"] });

    return () => {
      abort.abort();
      offOpen();
      playWatch.disconnect();
      modeWatch.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      for (const n of nodes) {
        n.removeAttribute("data-open");
        n.removeAttribute("data-dismissed");
        n.removeAttribute("data-flash");
      }
    };
  }, [index]);
  return null;
}
