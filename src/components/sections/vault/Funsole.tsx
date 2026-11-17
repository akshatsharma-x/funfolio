// The FUNSOLE (PART 10): an original console — chunky ink-violet body, candy buttons, power LED, speaker dots, a top
// slot and a CRT screen. Server-rendered with every cartridge's title card and details screen: in Play Mode VaultFx
// shows one at a time (CSS hides the rest); without JS and in Speedrun Mode they all read as a plain list.

import type { CSSProperties } from "react";
import { CATEGORY_LABEL } from "@/content/derived";
import type { Cartridge } from "@/content/vault";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Soon } from "@/components/ui/ComingSoon";
import { LootList } from "../quests/QuestParts";

function Screen({ cart }: { cart: Cartridge }) {
  const p = cart.project;
  const id = cart.id;
  const h = (k: string) => `screen-${id}-${k}`;
  return (
    <article className="crt-screen" data-screen={id} aria-labelledby={`screen-${id}`} tabIndex={-1}>
      <header className="crt-screen__head">
        <span className="crt-screen__code" aria-hidden="true">
          {cart.code}
        </span>
        <div>
          <h3 id={`screen-${id}`} className="crt-screen__title">
            {p.title}
          </h3>
          <p className="crt-screen__sub">{p.subtitle}</p>
        </div>
      </header>
      <dl className="crt-meta">
        <div>
          <dt>Genre</dt>
          <dd>{p.genre}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{CATEGORY_LABEL[p.category]}</dd>
        </div>
      </dl>
      {cart.story ? (
        <div className="crt-part">
          <h4 id={h("story")} className="crt-h">
            Story <span className="crt-h__plain">· Overview</span>
          </h4>
          <p className="read">{cart.story}</p>
        </div>
      ) : null}
      {cart.abilities.length ? (
        <div className="crt-part">
          <h4 id={h("abilities")} className="crt-h">
            Abilities <span className="crt-h__plain">· Highlights</span>
          </h4>
          <ul className="crt-list read">
            {cart.abilities.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {cart.stats.length ? (
        <div className="crt-part">
          <h4 id={h("stats")} className="crt-h">
            Stats <span className="crt-h__plain">· Results</span>
          </h4>
          <dl className="crt-stats">
            {cart.stats.map((s) => (
              <div key={s.label} className="crt-stat">
                <dt>{s.label}</dt>
                <dd>
                  {s.bar !== null ? (
                    <span className="crt-stat__bar" aria-hidden="true">
                      <span style={{ "--v": `${s.bar}%` } as CSSProperties} />
                    </span>
                  ) : null}
                  <span className="crt-stat__value">{s.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <div className="crt-part">
        <h4 id={h("stack")} className="crt-h">
          Stack <span className="crt-h__plain">· Loot</span>
        </h4>
        <LootList items={cart.loot} labelledBy={h("stack")} />
      </div>
      <div className="crt-part">
        <h4 id={h("links")} className="crt-h">
          Links <span className="crt-h__plain">· Demo &amp; code</span>
        </h4>
        <p className="crt-links">
          {cart.demo ? (
            <a className="crt-btn" href={cart.demo} data-cursor-label="OPEN">
              ▶ Play demo
            </a>
          ) : (
            <span className="crt-btn crt-btn--soon">
              ▶ Play demo <Soon />
            </span>
          )}
          {cart.repo ? (
            <a className="crt-btn" href={cart.repo} data-cursor-label="OPEN">
              &lt;/&gt; Source
            </a>
          ) : (
            <span className="crt-btn crt-btn--soon">
              &lt;/&gt; Source <Soon />
            </span>
          )}
        </p>
      </div>
      {cart.side?.kind === "game" ? (
        <p data-needs-js="">
          <button type="button" className="crt-btn crt-btn--quest" data-open-game={cart.side.id}>
            <PixelIcon name="cartridge" mono size={16} /> Side quest: {cart.side.name}
          </button>
        </p>
      ) : null}
      {cart.side?.kind === "hint" ? (
        <p className="crt-hint" data-needs-js="">
          {cart.side.text}
        </p>
      ) : null}
      {cart.side?.kind === "scan" ? (
        <div className="crt-scan" data-needs-js="">
          <button type="button" className="crt-btn crt-btn--quest" data-scan="">
            <PixelIcon name="sparkle" mono size={16} /> Scan this page
          </button>
          <p className="crt-scan__note">Runs axe-core (bundled — nothing leaves your browser) on this very page.</p>
          <div className="scan-results" data-scan-results="" />
        </div>
      ) : null}
    </article>
  );
}

export function Funsole({ carts }: { carts: Cartridge[] }) {
  return (
    <aside className="funsole" data-funsole="" data-phase="idle" aria-label="Funsole · the cartridge console" data-speedrun="plain">
      <div className="funsole__top" aria-hidden="true">
        <span className="slot-cart" data-slot-cart="">
          <span className="slot-cart__ridge" />
          <span className="slot-cart__label">
            <span className="slot-cart__code" data-slot-code="" />
            <span className="slot-cart__title" data-slot-title="" />
          </span>
        </span>
        <span className="funsole__lip" />
        <span className="funsole__brand">Funsole</span>
        <span className="funsole__led" />
      </div>
      <div className="funsole__crt" data-crt="" data-lenis-prevent="">
        <div className="crt-view">
          <div className="crt-attract" data-attract="" aria-hidden="true">
            <span className="crt-attract__stars" />
            <span className="crt-attract__text">Insert cartridge</span>
            <span className="crt-attract__hint">Pick one from the shelf</span>
          </div>
          <div className="crt-static" data-static="" aria-hidden="true" />
          {carts.map((c) => (
            <div key={c.id} className="crt-title" data-title-for={c.id} aria-hidden="true" style={{ "--from": c.from, "--to": c.to } as CSSProperties}>
              <span className="crt-title__logo">{c.code}</span>
              <span className="crt-title__name">{c.project.title}</span>
              <span className="crt-title__press">Loading…</span>
            </div>
          ))}
          {carts.map((c) => (
            <Screen key={c.id} cart={c} />
          ))}
        </div>
        {/* fullscreen and the expanded fallback (phones without element fullscreen) need a way out by touch */}
        <button type="button" className="crt-exit" data-exit-full="">
          Exit fullscreen
        </button>
      </div>
      <div className="funsole__controls">
        <span className="funsole__dpad" aria-hidden="true" />
        <span className="funsole__candy" aria-hidden="true">
          <span />
          <span />
        </span>
        <span className="funsole__buttons">
          <button type="button" className="funsole__btn" data-eject="" disabled>
            Eject
          </button>
          <button type="button" className="funsole__btn" data-fullscreen="" disabled>
            Fullscreen
          </button>
        </span>
        <span className="funsole__speaker" aria-hidden="true" />
      </div>
    </aside>
  );
}
