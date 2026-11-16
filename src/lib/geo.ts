// Small geo helpers for The Lab's globe and map (PART 9). Pure functions — shared by the server-rendered SVG map, the
// lazy 3D globe and scripts/globe-dots.mjs.

export type LatLon = { lat: number; lon: number };
type Ring = { pts: readonly (readonly number[])[]; x0: number; x1: number; y0: number; y1: number };
type GeoJson = { features: { geometry: { type: string; coordinates: unknown } }[] };

/** Point-in-land test for a GeoJSON of (Multi)Polygons in lon/lat (Natural Earth land): ray casting per ring. */
export function landTester(geo: GeoJson): (lon: number, lat: number) => boolean {
  const polygons: Ring[][] = [];
  for (const f of geo.features) {
    const g = f.geometry;
    const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as number[][][][];
    for (const poly of polys) {
      polygons.push(
        poly.map((pts) => {
          let x0 = 180;
          let x1 = -180;
          let y0 = 90;
          let y1 = -90;
          for (const [x, y] of pts) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
          return { pts, x0, x1, y0, y1 };
        }),
      );
    }
  }
  const inRing = (lon: number, lat: number, r: Ring) => {
    if (lon < r.x0 || lon > r.x1 || lat < r.y0 || lat > r.y1) return false;
    let inside = false;
    for (let i = 0, j = r.pts.length - 1; i < r.pts.length; j = i++) {
      const [xi, yi] = r.pts[i];
      const [xj, yj] = r.pts[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  return (lon, lat) => polygons.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some((h) => inRing(lon, lat, h)));
}

/** Unit-sphere position (lon 0 faces +z, north is +y). */
export function toVec3({ lat, lon }: LatLon, r = 1): [number, number, number] {
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)];
}

/** n+1 points along the great circle a → b, lifted off the sphere by `lift` × sin(πt) (an arc). */
export function greatCircleArc(a: LatLon, b: LatLon, n = 64, lift = 0.18): [number, number, number][] {
  const va = toVec3(a);
  const vb = toVec3(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  const out: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s = Math.sin(omega) || 1;
    const k0 = Math.sin((1 - t) * omega) / s;
    const k1 = Math.sin(t * omega) / s;
    const r = 1 + lift * Math.sin(Math.PI * t);
    out.push([(k0 * va[0] + k1 * vb[0]) * r, (k0 * va[1] + k1 * vb[1]) * r, (k0 * va[2] + k1 * vb[2]) * r]);
  }
  return out;
}

/** Points along the great circle in lon/lat (for flat maps). */
export function greatCircleLatLon(a: LatLon, b: LatLon, n = 48): LatLon[] {
  return greatCircleArc(a, b, n, 0).map(([x, y, z]) => ({ lat: (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI, lon: (Math.atan2(x, z) * 180) / Math.PI }));
}
