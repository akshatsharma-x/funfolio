import type { CSSProperties } from "react";
import type { RadarAxis } from "@/content/profile";
import { PlayOnView } from "@/components/ui/PlayOnView";

const SIZE = 200; // viewBox
const C = SIZE / 2;
const R = 92;

/** Clockwise from the top: the two longest labels go top and bottom, so the side labels need less room on phones. */
const PLACEMENT = ["java", "backend", "frontend", "ml", "genai", "research"];

const angle = (i: number, n: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
const at = (i: number, n: number, r: number) => [C + r * Math.cos(angle(i, n)), C + r * Math.sin(angle(i, n))] as const;
const poly = (n: number, r: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => at(i, n, r(i)))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

/**
 * FOCUS RADAR (PART 6): six domains, each an EVIDENCE COUNT from the résumé (content/profile.ts — no self-rating).
 * The SVG is decorative geometry that scales with the tile; the labels are HTML placed with container units so they
 * stay ≥ 12px at 320px; the legend says every number in words, with the entries behind it.
 */
export function FocusRadar({ axes: legend, titleId }: { axes: RadarAxis[]; titleId: string }) {
  const axes = [...PLACEMENT.flatMap((id) => legend.filter((a) => a.id === id)), ...legend.filter((a) => !PLACEMENT.includes(a.id))];
  const n = axes.length;
  const max = Math.max(1, ...axes.map((a) => a.value));
  const rings = Array.from({ length: max }, (_, k) => poly(n, () => (R * (k + 1)) / max));
  const shape = poly(n, (i) => (R * axes[i].value) / max);
  return (
    <figure className="radar" aria-labelledby={titleId}>
      <PlayOnView className="radar__plot" threshold={0.5}>
        <span className="radar__room" aria-hidden="true" />
        <svg className="radar__svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
          {rings.map((points, k) => (
            <polygon key={k} className="radar__ring" points={points} />
          ))}
          {axes.map((a, i) => {
            const [x, y] = at(i, n, R);
            return <line key={a.id} className="radar__axis" x1={C} y1={C} x2={x.toFixed(1)} y2={y.toFixed(1)} />;
          })}
          <g className="radar__shape">
            <polygon className="radar__area" points={shape} />
            {axes.map((a, i) => {
              const [x, y] = at(i, n, (R * a.value) / max);
              return <rect key={a.id} className="radar__dot" x={(x - 3).toFixed(1)} y={(y - 3).toFixed(1)} width="6" height="6" />;
            })}
          </g>
        </svg>
        {axes.map((a, i) => {
          const cos = Math.cos(angle(i, n));
          const sin = Math.sin(angle(i, n));
          const align = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
          const style = { "--cos": cos.toFixed(3), "--sin": sin.toFixed(3) } as CSSProperties;
          return (
            <span key={a.id} className="radar__label" data-align={align} data-v={sin < -0.5 ? "top" : sin > 0.5 ? "bottom" : "middle"} style={style} aria-hidden="true">
              <span className="radar__name">{a.label}</span>
              <span className="radar__value">{a.value}</span>
            </span>
          );
        })}
      </PlayOnView>
      <figcaption className="radar__caption">Evidence counts — based on what&apos;s on the résumé: each axis counts the roles, projects and papers that show it.</figcaption>
      <dl className="radar__legend">
        {legend.map((a) => (
          <div key={a.id} className="radar__row">
            <dt>{a.label}</dt>
            <dd>
              <span className="radar__count">{a.value}</span>
              {a.evidence.length ? <span className="radar__evidence">{a.evidence.join(" · ")}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
