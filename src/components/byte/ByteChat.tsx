"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { DialogueAction, DialogueData, DialogueOption } from "@/content/dialogue";
import { ACHIEVEMENTS } from "@/content/achievements";
import { COINS } from "@/content/coins";
import { PixelFrame } from "@/components/ui/PixelFrame";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { matchIntent } from "@/lib/ask";
import { bus } from "@/lib/bus";
import { byte, type ByteMood } from "@/lib/byte";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { scrollToElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { isPauseTab, useUi } from "@/lib/ui";

type Who = "byte" | "you";
type Line = { id: number; who: Who; text: string };
const MAX_LINES = 10;
const CHAR_MS = 18;

/** BYTE notices what the visitor has done (game copy about their run — never about Akshat). */
const REACTIONS: Readonly<Record<string, string>> = {
  "cheat-code": "You found the cheat code?! Respect.",
  "root-access": "sudo hire akshat — bold move. I like it.",
  "treasure-hunter": "All 12 hidden coins?! You're officially a legend.",
  "arcade-rat": "All six games played. Arcade rat confirmed.",
  "corner-case": "You checked every corner. Thorough!",
  bookworm: "You read both scrolls. Bookworm!",
  "co-op-invite": "You sent an invite — the mailbox says thanks.",
  completionist: "Every world visited. Speedrunners fear you.",
  hacker: "A terminal user. We speak the same language.",
  "global-minimum": "You found the global minimum. Smooth descent!",
};

/** Session memory: the last 10 lines survive closing and reopening while the page is open. */
const session = { lines: [] as Line[], seq: 0, greeted: false, reacted: new Set<string>(), joke: 0, hint: 0, node: "hub", options: null as DialogueOption[] | null };
const remember = (who: Who, text: string): Line => {
  const line: Line = { id: ++session.seq, who, text };
  session.lines = [...session.lines, line].slice(-MAX_LINES);
  return line;
};
const nextJoke = (jokes: readonly string[]) => jokes[session.joke++ % jokes.length] ?? "";
const nextHint = <T,>(left: readonly T[]) => left[session.hint++ % left.length];
const atNode = (id: string) => {
  session.node = id;
};
const keepOptions = (o: DialogueOption[]) => {
  session.options = o;
};
/** Greets once per page view; returns the reaction to the visitor's run, if any (and marks it said). */
const firstGreeting = (got: Record<string, number>): string | null | false => {
  if (session.greeted) return false;
  session.greeted = true;
  const id = Object.keys(REACTIONS)
    .filter((k) => got[k] && !session.reacted.has(k))
    .sort((a, b) => (got[b] ?? 0) - (got[a] ?? 0))[0];
  if (!id) return null;
  session.reacted.add(id);
  return REACTIONS[id] ?? null;
};
const markReacted = (id: string) => {
  session.reacted.add(id);
};

/**
 * Runs `fn` once no modal dialog is open. The pause menu animates out for 160ms and then hands focus back to where it came
 * from — which, the chat being non-modal (the page isn't inert), would take it from a chat opened from that menu.
 */
function afterDialogs(fn: () => void): () => void {
  const d = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (!d) {
    fn();
    return () => {};
  }
  let raf = 0;
  const go = () => {
    raf = requestAnimationFrame(fn);
  };
  d.addEventListener("close", go, { once: true });
  return () => {
    d.removeEventListener("close", go);
    cancelAnimationFrame(raf);
  };
}

function greeting(name: string | null, now = new Date()): string {
  const h = now.getHours();
  const you = name ? `, ${name}` : "";
  if (h < 5 || h >= 22) return `Up late${you}? Same.`;
  if (h < 12) return `Good morning${you}!`;
  if (h < 17) return `Good afternoon${you}!`;
  return `Good evening${you}!`;
}

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
 * Ask BYTE (PART 19): the speech bubble grown into a chat panel — an offline dialogue tree (src/content/dialogue.ts,
 * built from content.ts at build time) plus type-to-ask (src/lib/ask.ts). BYTE "thinks" for 300–600ms, types its reply
 * with blips and swaps moods; option chips move with the arrow keys, Enter picks, Esc closes (focus goes back to the
 * opener). The log keeps the last 10 lines; screen readers get each line once, whole. Non-modal: the page stays usable.
 * BYTE sits beside the panel while it's open (brain.ts' chat seat) and whatever it says lands in the log.
 */
export default function ByteChat({ data, open, onClose, resumeHref }: { data: DialogueData; open: boolean; onClose: () => void; resumeHref: string | null }) {
  const name = useSave((s) => s.visitor.name);
  // BYTE sits beside the panel unless it's minimized or switched off — then the panel takes the corner
  const withByte = useSave((s) => s.settings.byteVisible && !s.byte.minimized);
  const [lines, setLines] = useState<Line[]>(session.lines);
  const [options, setOptions] = useState<DialogueOption[]>(session.options ?? []);
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState<{ id: number; shown: number } | null>(null);
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const viaInput = useRef(false);
  /** Where focus goes once the next answer's topics are on the page (moved by the effect below, not a guessed frame). */
  const focusNext = useRef<"chip" | "input" | null>(null);
  const [turn, setTurn] = useState(0);
  const timers = useRef<number[]>([]);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const push = useCallback((who: Who, t: string) => {
    const line = remember(who, t);
    setLines(session.lines);
    return line;
  }, []);
  /** The hub's topics, plus "Forget my name" while BYTE remembers one. */
  const hubOptions = useCallback(
    (): DialogueOption[] => [...data.nodes.hub.options, ...(useSave.getState().visitor.name ? [{ label: "Forget my name", action: { type: "forget-name" } } as DialogueOption] : [])],
    [data],
  );
  const optionsOf = useCallback((id: string) => (id === "hub" ? hubOptions() : (data.nodes[id]?.options ?? hubOptions())), [data, hubOptions]);

  const focusFirst = () => requestAnimationFrame(() => optionsRef.current?.querySelector<HTMLElement>("[data-chip]")?.focus({ preventScroll: true }));
  /** BYTE answers: thinking dots for 300–600ms, then the line, typed (instant under reduced motion), and new chips. */
  const reply = useCallback(
    (t: string, mood: ByteMood, next: DialogueOption[]) => {
      // the chips stay (dimmed, inactive) while BYTE thinks, so focus — and Esc — never leave the chat
      setThinking(true);
      byte.react("thinking");
      later(() => {
        setThinking(false);
        const line = push("byte", t);
        byte.react(mood);
        keepOptions(next);
        setOptions(next);
        setActive(0);
        setTyping(prefersReducedMotion() ? null : { id: line.id, shown: 0 });
        focusNext.current = viaInput.current ? "input" : "chip";
        setTurn((n) => n + 1);
      }, 300 + Math.random() * 300);
    },
    [push],
  );

  const secretLine = () => {
    const found = new Set(useSave.getState().player.coinIds);
    const left = COINS.filter((c) => !found.has(c.id));
    if (!left.length) return `You've found all ${COINS.length} hidden coins — I'm out of coin secrets. The terminal still has a few: press the backtick key.`;
    const c = nextHint(left);
    return c ? `Psst… coin #${c.number}: ${c.hint}` : "";
  };
  const go = (id: string) => {
    const n = data.nodes[id] ?? data.nodes.hub;
    atNode(n.id);
    const line = n.id === "joke" ? nextJoke(data.jokes) : n.id === "secret" ? secretLine() : n.line;
    reply(line, n.mood, optionsOf(n.id));
  };

  const close = useCallback(
    (restore = true) => {
      setTyping(null);
      onClose();
      if (!restore) return;
      // next frame: BYTE's Ask button (hidden while chatting) is back, and an opener inside a closed menu is gone
      requestAnimationFrame(() => {
        const was = opener.current;
        const back = was && was !== document.body && was.isConnected && was.checkVisibility?.() !== false ? was : document.querySelector<HTMLElement>("[data-byte-ask]");
        back?.focus({ preventScroll: true });
      });
    },
    [onClose],
  );

  /** Actions that take the visitor somewhere: the chat steps aside so they see where they went. */
  const act = (a: DialogueAction) => {
    if (a.type === "copy-email") {
      void copy(data.email).then((ok) => {
        if (ok) command({ type: "achievement", id: "copycat" });
        reply(ok ? `Copied! ${data.email} is on your clipboard.` : `Your browser kept the clipboard to itself — here it is: ${data.email}`, ok ? "happy" : "dizzy", optionsOf(session.node));
      });
      return;
    }
    if (a.type === "forget-name") {
      useSave.getState().setVisitorName(null);
      reply("Done — your name is gone from this browser. Who are you again? 😄", "dizzy", hubOptions());
      return;
    }
    close(false);
    switch (a.type) {
      case "world": {
        const el = (a.anchor && document.getElementById(a.anchor)) || document.getElementById(a.id);
        if (el) scrollToElement(el, { focus: true });
        break;
      }
      case "game":
        command({ type: "openGame", id: a.id });
        break;
      case "scroll": {
        const btn = document.querySelector<HTMLElement>(`[data-scroll-open="${a.paper}"]`);
        if (btn) scrollToElement(btn, { block: "center", onComplete: () => btn.click() });
        break;
      }
      case "cartridge": {
        const vault = document.getElementById("vault");
        if (vault) scrollToElement(vault, { onComplete: () => bus.emit("vault:insert", { id: a.id }) });
        break;
      }
      case "jd": {
        bus.emit("skills:open", { tab: "jd" });
        const panel = document.getElementById("skills-jd") ?? document.getElementById("skills");
        if (panel) scrollToElement(panel, { focus: true });
        break;
      }
      case "pause":
        useUi.getState().openPause(isPauseTab(a.tab) ? a.tab : undefined);
        break;
      case "terminal":
        useUi.getState().setTerminal(true);
        break;
      case "speedrun":
        command({ type: "speedrun", on: true });
        break;
      case "download-resume":
        if (resumeHref) command({ type: "download", what: "resume" });
        break;
    }
  };

  const finishTyping = () => setTyping(null);
  const pick = (o: DialogueOption) => {
    if (thinking) return; // one answer at a time
    viaInput.current = false;
    finishTyping();
    push("you", o.label);
    if (o.action) act(o.action);
    else if (o.next) go(o.next);
  };
  const ask = (q: string) => {
    const t = q.replace(/\s+/g, " ").trim().slice(0, 120);
    if (!t || thinking) return;
    viaInput.current = true;
    finishTyping();
    push("you", t);
    setText("");
    const m = matchIntent(t, data.intents);
    if (m) return go(m.node);
    // "That's not in my save file!" + three topics the visitor hasn't asked about yet
    const asked = new Set(session.lines.filter((l) => l.who === "you").map((l) => l.text));
    const seen = new Set<string>();
    const three = [...data.starters.filter((s) => !asked.has(s.label)), ...data.starters].filter((s) => !seen.has(s.label) && seen.add(s.label)).slice(0, 3);
    reply(data.nodes.fallback.line, data.nodes.fallback.mood, [...three, { label: "All topics", next: "hub" }]);
  };

  // open: remember the opener, call BYTE to its seat beside the panel, greet once (time of day, the name, a reaction to
  // the run), focus the first chip; closing (or Speedrun Mode unmounting the chat) sends BYTE home
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // into the dialog at once (its name is announced; Esc already closes it) — the first topic takes over when it arrives
    const unfocus = afterDialogs(() => panelRef.current?.focus({ preventScroll: true }));
    const seat = requestAnimationFrame(() => bus.emit("byte:chat", { open: true })); // once the panel has its box
    // decided inside the task (Strict Mode runs this effect twice in dev and cancels the first one)
    let unfirst = () => {};
    const t = window.setTimeout(() => {
      const reaction = firstGreeting(useSave.getState().achievements);
      if (reaction === false) unfirst = afterDialogs(focusFirst); // reopened: the conversation (and its chips) are still here
      else reply(`${greeting(useSave.getState().visitor.name)} ${reaction ? `${reaction} ` : ""}${data.nodes.hub.line}`, reaction ? "surprised" : "happy", hubOptions());
    }, 0);
    return () => {
      cancelAnimationFrame(seat);
      window.clearTimeout(t);
      unfocus();
      unfirst();
      bus.emit("byte:chat", { open: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on open only
  }, [open]);

  // what BYTE says while the chat is open (a quip when it's clicked, a high-five, a form's error) lands in the log
  useEffect(
    () =>
      bus.on("chat:line", ({ text: said }) => {
        if (openRef.current && said) push("byte", said);
      }),
    [push],
  );

  // an achievement while the chat is open: BYTE says so right away
  useEffect(
    () =>
      bus.on("achievement:unlocked", ({ id }) => {
        if (!openRef.current) return;
        markReacted(id);
        const title = ACHIEVEMENTS.find((a) => a.id === id)?.title ?? "a new one";
        push("byte", REACTIONS[id] ?? `Achievement unlocked: ${title}! Nice.`);
        byte.react("surprised");
      }),
    [push],
  );

  // after each answer: focus on its first topic (or back in the text box after a typed question)
  useEffect(() => {
    const want = focusNext.current;
    focusNext.current = null;
    if (want === "input") inputRef.current?.focus({ preventScroll: true });
    else if (want === "chip") optionsRef.current?.querySelector<HTMLElement>("[data-chip]")?.focus({ preventScroll: true });
  }, [turn]);

  // the typewriter: time-based, with a blip every third letter (sound only when it's on — sfx decides)
  useEffect(() => {
    if (!typing) return;
    const line = session.lines.find((l) => l.id === typing.id);
    if (!line) return;
    const t = window.setTimeout(() => {
      const next = Math.min(line.text.length, typing.shown + 2);
      if (next % 3 < 2) sfx.play("blip");
      setTyping(next >= line.text.length ? null : { id: typing.id, shown: next });
    }, CHAR_MS * 2);
    return () => window.clearTimeout(t);
  }, [typing]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines, thinking, typing]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault(); // the keyboard manager (and the pad's B) skip a handled Esc
    e.stopPropagation();
    close(true);
  };
  const onChipKey = (e: ReactKeyboardEvent) => {
    const chips = [...(optionsRef.current?.querySelectorAll<HTMLElement>("[data-chip]") ?? [])];
    if (!chips.length) return;
    const i = Math.max(0, chips.indexOf(document.activeElement as HTMLElement));
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % chips.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + chips.length) % chips.length : e.key === "Home" ? 0 : e.key === "End" ? chips.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(to);
    chips[to]?.focus({ preventScroll: true });
  };

  if (!open) return null;
  return createPortal(
    <div
      ref={panelRef}
      className="chat"
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
      tabIndex={-1}
      data-chat=""
      data-with-byte={withByte ? "" : undefined}
      data-keyboard="exclusive"
      data-fx-skip=""
      data-lenis-prevent=""
      onKeyDown={onKeyDown}
    >
      <PixelFrame className="chat__frame" innerClassName="chat__inner">
        <div className="chat__head">
          <span className="chat__face" aria-hidden="true">
            <PixelIcon name="byte" size={24} />
          </span>
          <h2 id="chat-title" className="chat__title">
            Ask BYTE <span className="chat__plain">· offline chat</span>
          </h2>
          <button type="button" className="chat__close" aria-label="Close the chat" onClick={() => close(true)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {/* a tab stop, so the history scrolls by keyboard too (the box around it shows the focus ring) */}
        <div className="chat__logbox">
          <div ref={logRef} className="chat__log" role="log" aria-live="polite" aria-label="Conversation with BYTE" tabIndex={0} onClick={finishTyping}>
            {lines.map((l) => (
              <p key={l.id} className={`chat__line chat__line--${l.who}`}>
                <span className="sr-only">
                  {l.who === "byte" ? "BYTE" : "You"}: {l.text}
                </span>
                <span aria-hidden="true">{typing?.id === l.id ? l.text.slice(0, typing.shown) : l.text}</span>
              </p>
            ))}
            {thinking ? (
              <p className="chat__line chat__line--byte chat__thinking" aria-hidden="true">
                BYTE is thinking
                <span className="chat__dots">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div ref={optionsRef} className="chat__options" role="group" aria-label="Topics — arrow keys move, Enter picks" aria-busy={thinking} onKeyDown={onChipKey}>
          {options.map((o, i) => (
            <button key={o.label} type="button" className="chat__chip" data-chip="" aria-disabled={thinking || undefined} tabIndex={i === active ? 0 : -1} onFocus={() => setActive(i)} onClick={() => pick(o)}>
              {o.label}
            </button>
          ))}
        </div>
        <form
          className="chat__ask"
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask BYTE a question
          </label>
          <input id="chat-input" ref={inputRef} className="chat__input" value={text} onChange={(e) => setText(e.target.value)} maxLength={120} autoComplete="off" spellCheck={false} placeholder="Type a question…" />
          <button type="submit" className="chat__send" disabled={!text.trim() || thinking}>
            Ask
          </button>
        </form>
        <p className="chat__note">
          Offline — every answer comes from {data.first}&apos;s save file.{name ? " Your name stays on this browser only." : ""}
        </p>
      </PixelFrame>
    </div>,
    document.body,
  );
}
