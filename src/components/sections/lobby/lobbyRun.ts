// The Lobby island's logic, loaded after hydration by LobbyFx (it brings zod/mini — off the initial bundle, R7).
import { announce } from "@/lib/announce";
import { command } from "@/lib/commands";
import { prefersReducedMotion } from "@/lib/hooks/useReducedMotion";
import { BYTE_INVITE, checkInvite, inviteText, mailtoHref, MESSAGE_MAX, PLANE, SHEET, type Invite } from "@/lib/invite";
import { fx } from "@/lib/juice";
import { revealElement } from "@/lib/scroll";
import { sfx } from "@/lib/sfx";

const TYPE_MS = 24;
const SAY_FOLDED = "Folded! Pull the plane back and let go — or just press Enter. I'll catch it.";
const SAY_LANDED = "Delivered to the mailbox! Your email app takes it from here.";
const SAY_EDIT = "Take your time — I'll hold the plane.";
const PULL_MAX = 90;
const PULL_MIN = 24;
type QaInvite = { mailto?: string[] };

/** Copies text — the async clipboard where allowed, a selected textarea otherwise. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
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

const parse = (pts: string) => pts.split(" ").map((p) => p.split(",").map(Number));
const lerpPoints = (a: number[][], b: number[][], t: number) => a.map((p, i) => `${(p[0] + (b[i][0] - p[0]) * t).toFixed(2)},${(p[1] + (b[i][1] - p[1]) * t).toFixed(2)}`).join(" ");

/**
 * The Co-op Lobby's island (PART 15), on server-rendered DOM (LobbyFx imports this right after hydration):
 *  • BYTE types its line when the invite comes into view, and says what's wrong when the form isn't ready;
 *  • the form: zod/mini validation (bundled — no request), in-character errors on the fields, focus on the first;
 *  • SEND folds the form into a paper plane (an SVG morph) in its launcher; pull it back and let go, press Enter on it,
 *    or Auto-launch → it arcs into the mailbox portal (the arc stays inside the stage) → the flag pops, confetti,
 *    MESSAGE READY under the launcher, Co-op Invite, and a mailto: opens in the visitor's own mail app ([Copy message]
 *    for people without one);
 *  • the portals: copy the address (Copycat + "Item acquired: Email"), reveal the phone, the save-file download.
 * Reduced motion: no typing, folding or flight — the same steps, at once. Speedrun Mode: no typing or blinking, and
 * Send opens the mailto at once (the plane is play, not contact).
 */
export function mountLobby(section: HTMLElement): () => void {
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
  const reduced = () => prefersReducedMotion();
  // Speedrun Mode removes friction: BYTE's line shows at once and Send goes straight to the mailto (no plane)
  const speedrun = () => document.documentElement.getAttribute("data-mode") === "speedrun";
  const instant = () => reduced() || speedrun();
  const center = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const qa = (window as unknown as { __QA_INVITE?: QaInvite }).__QA_INVITE;

  const form = section.querySelector<HTMLFormElement>("[data-invite-form]");
  const to = form?.dataset.to ?? "";
  const line = section.querySelector<HTMLElement>("[data-invite-line]");
  const ghost = line?.querySelector<HTMLElement>(".invite__ghost") ?? null;
  const typed = section.querySelector<HTMLElement>("[data-invite-typed]");
  const srLine = section.querySelector<HTMLElement>("[data-invite-sr]");
  const launcher = section.querySelector<HTMLElement>("[data-launcher]");
  const stage = section.querySelector<HTMLElement>("[data-launch-stage]");
  const launchActions = section.querySelector<HTMLElement>("[data-launch-actions]");
  const launchHint = section.querySelector<HTMLElement>("#launcher-hint");
  const plane = section.querySelector<HTMLElement>("[data-plane]");
  const shape = section.querySelector<SVGPolygonElement>("[data-plane-shape]");
  const band = section.querySelector<HTMLElement>("[data-launch-band]");
  const mailbox = section.querySelector<HTMLElement>("[data-mailbox]");
  const done = section.querySelector<HTMLElement>("[data-invite-done]");
  const mailLink = section.querySelector<HTMLAnchorElement>("[data-invite-mailto]");
  const xpTag = section.querySelector<HTMLElement>("[data-invite-xp]");
  const counter = section.querySelector<HTMLElement>("[data-invite-count]");
  if (form) form.noValidate = true; // the island shows BYTE's errors instead of the browser's bubbles

  // ── BYTE's line ───────────────────────────────────────────────────────────────────────────────────────────────
  let typing = 0;
  const say = (text: string) => {
    if (!line || !ghost || !typed) return;
    window.clearTimeout(typing);
    ghost.textContent = text;
    if (srLine) srLine.textContent = text;
    if (instant()) {
      typed.textContent = "";
      line.removeAttribute("data-typing");
      return;
    }
    line.setAttribute("data-typing", "");
    let n = 0;
    const step = () => {
      n += 1;
      typed.textContent = text.slice(0, n);
      if (n < text.length) {
        if (n % 3 === 0) sfx.play("blip", { pitch: 1.2 + (n % 7) * 0.05 });
        typing = window.setTimeout(step, TYPE_MS);
      } else {
        line.removeAttribute("data-typing");
        typed.textContent = "";
      }
    };
    step();
  };
  const sayIo = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      sayIo.disconnect();
      say(BYTE_INVITE);
    },
    { threshold: 0.5 },
  );
  if (line) sayIo.observe(line);
  // "PLAYER 2, PRESS START" blinks five times the first time it's seen (bounded, WCAG 2.2.2)
  const press = section.querySelector<HTMLElement>("[data-lobby-press]");
  const pressIo = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      pressIo.disconnect();
      if (!instant()) press?.setAttribute("data-blink", "");
    },
    { threshold: 0.6 },
  );
  if (press) pressIo.observe(press);

  // ── the form ──────────────────────────────────────────────────────────────────────────────────────────────────
  let invite: Invite | null = null;
  const field = (name: string) => form?.querySelector<HTMLElement>(name === "quest" ? 'input[name="quest"]' : `[name="${name}"]`) ?? null;
  const showErrors = (errors: Partial<Record<string, string>>) => {
    for (const name of ["name", "quest", "message"]) {
      const msg = errors[name];
      const err = form?.querySelector<HTMLElement>(`[data-err="${name}"]`);
      if (err) err.textContent = msg ?? "";
      if (name === "quest") form?.querySelector("fieldset")?.toggleAttribute("data-invalid", !!msg);
      else field(name)?.setAttribute("aria-invalid", String(!!msg));
    }
  };
  // PART 19 · a name typed (and left) in the field is remembered for BYTE's chat — on this browser only
  form?.addEventListener(
    "change",
    (e) => {
      const t = e.target as HTMLInputElement;
      if (t.name === "name" && t.value.trim()) command({ type: "visitor-name", name: t.value });
    },
    on,
  );
  form?.addEventListener(
    "input",
    (e) => {
      const t = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (t.name === "message" && counter) {
        counter.textContent = String(t.value.length);
        counter.parentElement?.toggleAttribute("data-over", t.value.trim().length > MESSAGE_MAX);
      }
      const err = form.querySelector<HTMLElement>(`[data-err="${t.name}"]`);
      if (err?.textContent) {
        err.textContent = "";
        if (t.name === "quest") form.querySelector("fieldset")?.removeAttribute("data-invalid");
        else t.setAttribute("aria-invalid", "false");
      }
    },
    on,
  );
  const fold = async () => {
    if (!form || !launcher || !shape) return;
    if (!reduced()) {
      await form.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: "perspective(900px) rotateX(58deg) scale(0.7)", opacity: 0.8, offset: 0.55 },
          { transform: "perspective(900px) rotateX(70deg) scale(0.12) rotate(-16deg)", opacity: 0 },
        ],
        { duration: 520, easing: "cubic-bezier(.5,0,.75,0)" },
      ).finished.catch(() => {});
    }
    form.hidden = true;
    launcher.hidden = false;
    if (launchActions) launchActions.hidden = false;
    if (launchHint) launchHint.hidden = false;
    mailbox?.removeAttribute("data-landed");
    plane?.removeAttribute("data-flying");
    plane?.style.removeProperty("translate");
    plane?.getAnimations().forEach((a) => a.cancel());
    // the launcher is shorter than the form it replaces: from down at Send, it can sit above the screen (WCAG 2.4.11)
    revealElement(launcher);
    if (reduced()) shape.setAttribute("points", PLANE);
    else {
      // the sheet becomes a paper plane: the same four points, eased from one shape to the other
      const a = parse(SHEET);
      const b = parse(PLANE);
      const t0 = performance.now();
      await new Promise<void>((res) => {
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / 460);
          const e = 1 - (1 - t) ** 3;
          shape.setAttribute("points", lerpPoints(a, b, e));
          if (t < 1) requestAnimationFrame(tick);
          else res();
        };
        requestAnimationFrame(tick);
      });
    }
    sfx.play("squish", { pitch: 1.4 });
    say(SAY_FOLDED);
    plane?.focus({ preventScroll: true });
    announce("Folded into a paper plane. Press Enter on it, or Auto-launch, to fly it to the mailbox.");
  };
  form?.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const r = checkInvite({ name: data.get("name") ?? "", quest: data.get("quest") ?? undefined, message: data.get("message") ?? "" });
      if (!r.ok) {
        showErrors(r.errors);
        const first = (["name", "quest", "message"] as const).find((k) => r.errors[k]);
        if (first) {
          say(r.errors[first] ?? "");
          announce(r.errors[first] ?? "");
          field(first)?.focus();
        }
        sfx.play("error");
        return;
      }
      showErrors({});
      command({ type: "visitor-name", name: r.invite.name }); // PART 19 · BYTE greets them by it (save file only)
      invite = r.invite;
      sfx.play("powerUp");
      if (speedrun()) {
        form.hidden = true;
        land();
      } else void fold();
    },
    on,
  );

  // ── the flight ────────────────────────────────────────────────────────────────────────────────────────────────
  let flying = false;
  const land = () => {
    if (!invite || !done || !launcher) return;
    const href = mailtoHref(to, invite);
    if (mailLink) mailLink.href = href;
    let first = true;
    try {
      first = !JSON.parse(localStorage.getItem("funfolio-save") ?? "{}")?.state?.achievements?.["co-op-invite"];
    } catch {
      first = true;
    }
    if (xpTag) xpTag.textContent = first ? "+200 XP" : "";
    // the flag pops and the portal flashes; the launcher stays to show it, the done panel opens under it
    mailbox?.setAttribute("data-landed", "");
    if (launchActions) launchActions.hidden = true;
    if (launchHint) launchHint.hidden = true;
    sfx.play("fanfare");
    if (!reduced()) fx.confetti(); // confetti keeps off the words (#62); the panel says MESSAGE READY itself
    command({ type: "achievement", id: "co-op-invite" });
    say(SAY_LANDED);
    done.hidden = false;
    done.focus({ preventScroll: true });
    revealElement(done);
    announce("Message ready. Your email app should open with the invite — or copy it from here.");
    // the visitor's own mail app writes and sends it — no server (R10); tests record instead of leaving the page
    if (qa) qa.mailto?.push(href);
    else {
      const a = document.createElement("a");
      a.href = href;
      a.click();
    }
    flying = false;
  };
  // pulled = where a drag left the plane (its inline translate); Enter / Auto-launch wind it back first
  const launch = async (pulled?: { x: number; y: number }) => {
    if (flying || !plane || !mailbox || !invite) return;
    flying = true;
    plane.setAttribute("data-flying", "");
    band?.style.removeProperty("scale");
    sfx.play("whoosh");
    if (!reduced()) {
      const pull = pulled ?? { x: -34, y: 12 };
      const now = center(plane);
      const base = pulled ? { x: now.x - pulled.x, y: now.y - pulled.y } : now; // the plane's resting centre
      const target = center(mailbox);
      const dx = target.x - base.x;
      const dy = target.y - base.y;
      // the arc's top stays inside the stage: 30% from its top, up to 18% for a full pull
      const k = Math.min(1, Math.hypot(pull.x, pull.y) / PULL_MAX);
      const box = stage?.getBoundingClientRect();
      const peak = box ? box.top + box.height * (0.3 - 0.12 * k) : base.y - 80;
      const lift = Math.max(24, base.y + (pull.y + dy) / 2 - peak);
      const wind = pulled ? 0 : 0.18; // the share of the flight spent winding back
      const frames: Keyframe[] = pulled ? [] : [{ translate: "0px 0px", rotate: "0deg", scale: "1", opacity: 1, offset: 0 }];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const x = pull.x * (1 - t) + dx * t;
        const y = pull.y * (1 - t) + dy * t - Math.sin(Math.PI * t) * lift;
        const tx = dx - pull.x;
        const ty = dy - pull.y - Math.cos(Math.PI * t) * Math.PI * lift;
        frames.push({
          translate: `${x.toFixed(1)}px ${y.toFixed(1)}px`,
          rotate: `${((Math.atan2(ty, tx) * 180) / Math.PI).toFixed(1)}deg`,
          scale: String(1 - t * 0.55),
          opacity: t > 0.92 ? 0 : 1,
          offset: wind + (1 - wind) * t,
        });
      }
      await plane.animate(frames, { duration: pulled ? 900 : 1100, easing: "cubic-bezier(.35,.1,.55,1)", fill: "forwards" }).finished.catch(() => {});
    }
    land();
  };
  section.querySelector("[data-launch-auto]")?.addEventListener("click", () => void launch(), on);
  plane?.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      void launch();
    },
    on,
  );
  // pull and release (optional — Enter and Auto-launch do the same, R5)
  let drag: { id: number; x: number; y: number; room: number; pull: { x: number; y: number } } | null = null;
  plane?.addEventListener(
    "pointerdown",
    (e) => {
      if (flying || e.button !== 0) return;
      e.preventDefault();
      plane.setPointerCapture(e.pointerId);
      // never pulled out of the stage (narrow screens have less room behind the gate)
      const room = stage ? Math.max(PULL_MIN, plane.getBoundingClientRect().left - stage.getBoundingClientRect().left - 6) : PULL_MAX;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, room: Math.min(PULL_MAX, room), pull: { x: 0, y: 0 } };
      plane.setAttribute("data-grabbed", "");
    },
    on,
  );
  plane?.addEventListener(
    "pointermove",
    (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      let x = Math.max(-drag.room, Math.min(0, e.clientX - drag.x));
      let y = Math.max(-PULL_MAX / 2, Math.min(PULL_MAX / 2, e.clientY - drag.y));
      const len = Math.hypot(x, y);
      if (len > PULL_MAX) {
        x = (x / len) * PULL_MAX;
        y = (y / len) * PULL_MAX;
      }
      drag.pull = { x, y };
      plane.style.translate = `${x}px ${y}px`;
      band?.style.setProperty("scale", `${1 + Math.abs(x) / 60} 1`);
    },
    on,
  );
  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const pull = drag.pull;
    drag = null;
    plane?.removeAttribute("data-grabbed");
    if (Math.hypot(pull.x, pull.y) >= PULL_MIN) void launch(pull);
    else {
      plane?.style.removeProperty("translate");
      band?.style.removeProperty("scale");
    }
  };
  plane?.addEventListener("pointerup", release, on);
  plane?.addEventListener("pointercancel", release, on);

  section.querySelector("[data-launch-edit]")?.addEventListener(
    "click",
    () => {
      if (!form || !launcher || flying) return;
      launcher.hidden = true;
      form.hidden = false;
      say(SAY_EDIT);
      form.querySelector<HTMLElement>("[name=message]")?.focus();
    },
    on,
  );
  section.querySelector("[data-invite-copy]")?.addEventListener(
    "click",
    () => {
      if (!invite) return;
      void copyText(inviteText(to, invite)).then((ok) =>
        command({ type: "item", title: ok ? "Message copied" : "Copy blocked", detail: ok ? "To, subject and message — paste it into any email" : "Select the text in your email app instead" }),
      );
    },
    on,
  );
  section.querySelector("[data-invite-again]")?.addEventListener(
    "click",
    () => {
      if (!form || !done || !launcher || flying) return;
      done.hidden = true;
      launcher.hidden = true;
      mailbox?.removeAttribute("data-landed");
      form.hidden = false;
      const msg = form.querySelector<HTMLTextAreaElement>("[name=message]");
      if (msg) msg.value = "";
      if (counter) counter.textContent = "0";
      invite = null;
      say(BYTE_INVITE);
      msg?.focus();
    },
    on,
  );

  // ── the portals ───────────────────────────────────────────────────────────────────────────────────────────────
  section.addEventListener(
    "click",
    (e) => {
      const target = e.target as Element;
      const copy = target.closest<HTMLElement>("[data-copy-email]");
      if (copy) {
        void copyText(copy.dataset.copyEmail ?? "").then((ok) => {
          if (!ok) {
            command({ type: "item", title: "Copy blocked", detail: "Select the address instead" });
            return;
          }
          command({ type: "item", title: "Email", detail: "Copied to the clipboard" }, { type: "achievement", id: "copycat" });
          copy.textContent = "Copied!";
          later(() => (copy.textContent = "Copy address"), 1800);
        });
        return;
      }
      const reveal = target.closest<HTMLButtonElement>("[data-reveal-phone]");
      if (reveal) {
        const num = reveal.closest(".portal")?.querySelector<HTMLElement>("[data-phone]");
        if (num) num.hidden = false;
        reveal.setAttribute("aria-expanded", "true");
        reveal.textContent = "Number shown";
        return;
      }
      if (target.closest("[data-download-resume]")) command({ type: "download", what: "resume" });
    },
    on,
  );

  return () => {
    abort.abort();
    sayIo.disconnect();
    pressIo.disconnect();
    window.clearTimeout(typing);
    timers.forEach((t) => window.clearTimeout(t));
  };
}
