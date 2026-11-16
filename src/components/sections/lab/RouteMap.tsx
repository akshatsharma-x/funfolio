import type { CSSProperties } from "react";
import type { routeMap } from "@/content/lab";

type Map = NonNullable<ReturnType<typeof routeMap>>;

/**
 * The research route as a flat dot-matrix map (PART 9): the no-JS / LOW-tier / touch view of the globe, server-rendered
 * from the bundled Natural Earth land. Decorative — the figure caption says it in words.
 */
export function RouteMap({ map }: { map: Map }) {
  const { w, h, land, from, to, arc, route } = map;
  const at = (p: { x: number; y: number }) => ({ "--x": `${((p.x / w) * 100).toFixed(2)}%`, "--y": `${((p.y / h) * 100).toFixed(2)}%` }) as CSSProperties;
  return (
    <div className="route-map" style={{ "--ar": `${w} / ${h}` } as CSSProperties}>
      <svg className="route-map__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <path className="route-map__land" d={land} />
        <path className="route-map__arc" d={arc} />
        {[from, to].map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <circle className="route-map__halo" r="1.5" />
            <circle className="route-map__pin" r="0.7" />
          </g>
        ))}
      </svg>
      <span className="route-map__label" style={at(from)} aria-hidden="true">
        <span className="globe-label__title">{route.from.label}</span>
      </span>
      <span className="route-map__label route-map__label--to" style={at(to)} aria-hidden="true">
        <span className="globe-label__title">{route.to.label}</span>
        {route.to.detail ? <span className="globe-label__detail">{route.to.detail}</span> : null}
      </span>
    </div>
  );
}
