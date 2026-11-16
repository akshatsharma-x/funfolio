// The active quest's illustrative widgets (PART 8). Each one restates a real stat of the current role (label + exact
// value); the gauge, the token blocks, the hash and the graph are decoration and say so (R1). Server-rendered in
// their final state; QuestLogFx plays them in on first view.

import type { CSSProperties } from "react";
import { cartographerGraph, type ActiveWidgets as Widgets } from "@/content/quests";
import type { Stat } from "@/content/content";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PixelIcon } from "@/components/ui/PixelIcon";

function StatLine({ stat }: { stat: Stat }) {
  return (
    <dl className="widget__stat">
      <dt>{stat.label}</dt>
      <dd>{/\d/.test(stat.value) ? <NumberRoll value={stat.value} /> : stat.value}</dd>
    </dl>
  );
}

// ── COST METER ───────────────────────────────────────────────────────────────────────────────────────────────────
const GAUGE = { cx: 70, cy: 70, r: 54 };
/** Where the needle settles on the (number-free) dial: illustrative, low on the sweep. */
const COST_AT = 0.22;
const polar = (t: number, r = GAUGE.r) => {
  const a = Math.PI * (1 - t); // t 0 → left end, 1 → right end
  return { x: GAUGE.cx + r * Math.cos(a), y: GAUGE.cy - r * Math.sin(a) };
};
const arc = (t0: number, t1: number, r = GAUGE.r) => {
  const a = polar(t0, r);
  const b = polar(t1, r);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

function CostMeter({ w }: { w: Widgets }) {
  return (
    <figure className="widget widget--cost" data-widget="cost">
      <figcaption className="widget__title">
        <PixelIcon name="coin" mono size={16} /> Cost meter
      </figcaption>
      <svg className="gauge" viewBox="0 0 140 84" aria-hidden="true" focusable="false">
        <path className="gauge__track" d={arc(0, 1)} />
        <path className="gauge__band" d={arc(COST_AT - 0.05, COST_AT + 0.05)} />
        {Array.from({ length: 11 }, (_, i) => {
          const a = polar(i / 10, GAUGE.r - 13);
          const b = polar(i / 10, GAUGE.r - (i % 5 === 0 ? 21 : 17));
          return <line key={i} className="gauge__tick" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
        <g className="gauge__needle" style={{ "--a": `${-90 + 180 * COST_AT}deg` } as CSSProperties}>
          <path d={`M${GAUGE.cx - 4} ${GAUGE.cy} L${GAUGE.cx} ${GAUGE.cy - GAUGE.r + 8} L${GAUGE.cx + 4} ${GAUGE.cy} Z`} />
          <circle cx={GAUGE.cx} cy={GAUGE.cy} r="7" />
        </g>
      </svg>
      <dl className="widget__stat">
        <dt>{w.cost.label}</dt>
        <dd>
          {w.coin ? (
            <>
              <button type="button" className="coin-egg" data-coin-egg="active-quest">
                {w.coin.head}
              </button>
              {w.coin.tail}
            </>
          ) : (
            w.cost.value
          )}
        </dd>
      </dl>
    </figure>
  );
}

// ── TOKEN SQUEEZE ────────────────────────────────────────────────────────────────────────────────────────────────
function TokenSqueeze({ w }: { w: Widgets }) {
  const [lo, hi] = w.squeeze;
  // compressed by lo–hi % → the row ends between (100 − hi)% and (100 − lo)% of its original length
  const style = { "--band-from": `${100 - hi}%`, "--band-width": `${hi - lo}%`, "--squeezed": (200 - lo - hi) / 200 } as CSSProperties;
  return (
    <figure className="widget widget--tokens" data-widget="tokens">
      <figcaption className="widget__title">
        <PixelIcon name="sparkle" mono size={16} /> Token squeeze
      </figcaption>
      <div className="tokens" style={style} aria-hidden="true">
        <span className="tokens__ghost" />
        <span className="tokens__band" />
        <span className="tokens__row">
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="tokens__t" />
          ))}
        </span>
      </div>
      <StatLine stat={w.tokens} />
    </figure>
  );
}

// ── SHA256 CACHE ─────────────────────────────────────────────────────────────────────────────────────────────────
function CacheHit({ w }: { w: Widgets }) {
  const shown = `${w.hash.slice(0, 16)}…`;
  return (
    <figure className="widget widget--cache" data-widget="cache">
      <figcaption className="widget__title">
        <PixelIcon name="key" mono size={16} /> SHA256 cache
      </figcaption>
      <p className="cache__hash" aria-hidden="true" data-hash={shown}>
        {shown}
      </p>
      <p className="cache__hit" aria-hidden="true">
        <PixelIcon name="check" mono size={16} /> Cache hit
      </p>
      <StatLine stat={w.cache} />
    </figure>
  );
}

// ── CARTOGRAPHER MAP ─────────────────────────────────────────────────────────────────────────────────────────────
function CartographerMap({ w }: { w: Widgets }) {
  const g = cartographerGraph();
  return (
    <figure className="widget widget--map" data-widget="map">
      <figcaption className="widget__title">
        <PixelIcon name="map" mono size={16} /> Cartographer <span className="widget__tag">illustrative: code knowledge graph</span>
      </figcaption>
      <div className="kg" aria-hidden="true">
        <svg className="kg__graph" viewBox={`0 0 ${g.w} ${g.h}`} focusable="false">
          {g.edges.map((e, i) => (
            <line
              key={i}
              className="kg__edge"
              x1={g.nodes[e.a].x}
              y1={g.nodes[e.a].y}
              x2={g.nodes[e.b].x}
              y2={g.nodes[e.b].y}
              pathLength={1}
              style={{ "--o": e.order } as CSSProperties}
            />
          ))}
          {g.nodes.map((n, i) => (
            <circle key={i} className={`kg__node kg__node--${n.kind}`} cx={n.x} cy={n.y} r={n.r} style={{ "--o": n.order } as CSSProperties} />
          ))}
        </svg>
        <span className="kg__out">
          {Array.from({ length: w.calls }, (_, i) => (
            <span key={`c${i}`} className="kg__call" style={{ "--i": i } as CSSProperties}>
              <PixelIcon name="bolt" mono size={16} />
            </span>
          ))}
          <span className="kg__arrow">→</span>
          {Array.from({ length: w.docs }, (_, i) => (
            <span key={`d${i}`} className="kg__doc" style={{ "--i": i } as CSSProperties}>
              <PixelIcon name="scroll" mono size={16} />
            </span>
          ))}
        </span>
      </div>
      {w.caption.length ? <p className="kg__caption">{w.caption.join(" · ")}</p> : null}
      <StatLine stat={w.map} />
    </figure>
  );
}

export function ActiveWidgets({ w }: { w: Widgets }) {
  return (
    <div className="widgets">
      <CostMeter w={w} />
      <TokenSqueeze w={w} />
      <CacheHit w={w} />
      <CartographerMap w={w} />
    </div>
  );
}
