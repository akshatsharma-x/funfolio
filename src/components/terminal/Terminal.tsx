"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { TermLine, TerminalData } from "@/content/eggs";
import { command } from "@/lib/commands";
import { fx } from "@/lib/juice";
import { lockScroll, scrollToElement, unlockScroll } from "@/lib/scroll";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { sfx } from "@/lib/sfx";
import { useSave } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { switchTheme } from "@/components/hud/useGameRuntime";
import { complete, runCommand, type Effect } from "./commands";

type Entry = { id: number; input: string | null; lines: TermLine[] };
// history survives closing and reopening (this page view)
const history: string[] = [];
let seq = 0;

/**
 * AKSHAT-OS (PART 16): a terminal overlay in JetBrains Mono — a multicolor prompt, history (↑/↓), Tab completion and
 * every command from the brief, answered from content.ts. A native modal <dialog> (top layer: the cursor stays above,
 * R2; the page behind is inert); Tab completes inside the prompt, so the dialog manages focus itself — Esc, `exit` or
 * the close button leave (WCAG 2.1.2). Output goes to a polite log for screen readers. Opening it unlocks Hacker.
 */
export default function Terminal({ data, resumeHref, open, onClose }: { data: TerminalData; resumeHref: string | null; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [log, setLog] = useState<Entry[]>(() => [{ id: seq++, input: null, lines: data.motd }]);
  const [value, setValue] = useState("");
  const [cursor, setCursor] = useState(-1);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
      lockScroll();
      sfx.play("open", { pitch: 0.8 });
      command({ type: "achievement", id: "hacker" });
      useSave.getState().findEgg("terminal");
      input.current?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);
  useEffect(() => () => unlockScroll(), []);

  // keep the newest output in view
  useEffect(() => {
    const el = screen.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const onDialogClose = () => {
    unlockScroll();
    sfx.play("close", { pitch: 0.8 });
    returnTo.current?.focus({ preventScroll: true });
    returnTo.current = null;
    if (useUi.getState().terminalOpen) onClose();
  };

  const apply = (effects: Effect[]) => {
    for (const e of effects) {
      if (e.kind === "clear") setLog([]);
      else if (e.kind === "close") onClose();
      else if (e.kind === "play") useUi.getState().openGame(e.id);
      else if (e.kind === "theme") switchTheme(e.value);
      else if (e.kind === "download" && resumeHref) {
        const a = document.createElement("a");
        a.href = resumeHref;
        a.download = "";
        a.click();
        command({ type: "download", what: "resume" });
      } else if (e.kind === "hire") {
        command({ type: "achievement", id: "root-access" });
        window.setTimeout(() => {
          onClose();
          if (!prefersReducedMotion()) {
            fx.confetti({ style: "stars" });
            for (let i = 0; i < 4; i++) window.setTimeout(() => fx.burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.15 + Math.random() * 0.3), { shape: "star", count: 18 }), i * 220);
          }
          sfx.play("win");
          const lobby = document.getElementById("lobby");
          if (lobby) window.setTimeout(() => scrollToElement(lobby, { focus: true }), 350);
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load: the home page's pre-paint script has to run
      else location.assign("/#lobby");
        }, 700);
      }
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value;
    setValue("");
    setCursor(-1);
    if (text.trim()) {
      if (history[history.length - 1] !== text) history.push(text);
      if (history.length > 50) history.shift();
    }
    const r = runCommand(text, { data, resumeHref });
    sfx.play("blip", { pitch: 1.1 });
    const clears = r.effects?.some((x) => x.kind === "clear");
    if (!clears) setLog((l) => [...l, { id: seq++, input: text, lines: r.lines }].slice(-80));
    if (r.effects) apply(r.effects);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!history.length) return;
      e.preventDefault();
      const next = e.key === "ArrowUp" ? (cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)) : cursor < 0 ? -1 : cursor + 1;
      if (next < 0 || next >= history.length) {
        setCursor(-1);
        setValue("");
      } else {
        setCursor(next);
        setValue(history[next]);
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const c = complete(value, { data, resumeHref });
      setValue(c.value);
      if (c.choices.length) setLog((l) => [...l, { id: seq++, input: value, lines: [{ text: c.choices.join("   "), tone: "muted" }] }]);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLog([]);
    }
  };

  return (
    <dialog
      ref={ref}
      className="terminal"
      aria-labelledby="terminal-title"
      onClose={onDialogClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-lenis-prevent=""
      data-keyboard="exclusive"
    >
      <div className="terminal__frame">
        <div className="terminal__bar">
          <span className="terminal__lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2 id="terminal-title" className="terminal__title">
            AKSHAT-OS · Terminal
          </h2>
          <button type="button" className="terminal__close" onClick={onClose} aria-label="Close the terminal (Esc)">
            ×
          </button>
        </div>
        <div className="terminal__screen" ref={screen} onClick={() => input.current?.focus()}>
          <div className="terminal__log" role="log" aria-live="polite" aria-label="Terminal output">
            {log.map((entry) => (
              <div key={entry.id} className="terminal__entry">
                {entry.input !== null ? (
                  <p className="terminal__echo">
                    <Prompt user={data.user} host={data.host} />
                    <span className="terminal__cmd">{entry.input}</span>
                  </p>
                ) : null}
                {entry.lines.map((l, i) => (
                  <p key={i} className="terminal__out" data-tone={l.tone}>
                    {l.href ? (
                      <a href={l.href} {...(/^https?:/.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {l.text}
                      </a>
                    ) : (
                      l.text || " "
                    )}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <form className="terminal__line" onSubmit={submit}>
            <label htmlFor="terminal-input" className="terminal__label">
              <Prompt user={data.user} host={data.host} />
              <span className="sr-only">Command</span>
            </label>
            <input
              ref={input}
              id="terminal-input"
              className="terminal__input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              aria-describedby="terminal-help"
            />
            <span id="terminal-help" className="sr-only">
              Type help and press Enter. Tab completes, the up and down arrows recall earlier commands, Escape closes.
            </span>
          </form>
        </div>
      </div>
    </dialog>
  );
}

function Prompt({ user, host }: { user: string; host: string }) {
  return (
    <span className="terminal__prompt" aria-hidden="true">
      <span className="terminal__user">{user}</span>
      <span className="terminal__at">@</span>
      <span className="terminal__host">{host}</span>
      <span className="terminal__at">:</span>
      <span className="terminal__path">~</span>
      <span className="terminal__dollar">$</span>{" "}
    </span>
  );
}
