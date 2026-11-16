// The Lab (PART 9): the bosses, the stats strip and the research route — computed from content.ts (R1). Server-only:
// the route map reads public/data/ne_110m_land.geojson at build time.

import { readFileSync } from "node:fs";
import path from "node:path";
import { greatCircleLatLon, landTester, type LatLon } from "@/lib/geo";
import { BOSS_ART, BOSS_HITS, type BossArt } from "./bossArt";
import { education, player, research } from "./content";
import { counts, known } from "./derived";

export type Paper = (typeof research)[number];
export type Boss = { paper: Paper; art: BossArt | null; hits: readonly [string, string, string] | null };

export const bosses = (): Boss[] => research.map((paper) => ({ paper, art: BOSS_ART[paper.id] ?? null, hits: BOSS_HITS[paper.id] ?? null }));
export const bossIds = (): string[] => research.map((p) => p.id);

const CONFERENCE = /\b[A-Z]{2,}-\d{4}\b/; // "SCI-2026"
const SERIES = /\(([^)]+)\)/; // "(Springer LNNS)"
const distinct = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];

/** "2 papers · 1 international conference · Springer LNNS · SCI-2026" — each part read off the venues. */
export function labStats(): string[] {
  const codes = distinct(research.map((r) => r.venue.match(CONFERENCE)?.[0]));
  const series = distinct(research.map((r) => r.venue.match(SERIES)?.[1]));
  const international = research.some((r) => /\binternational\b/i.test(r.venue));
  const items = [`${counts.papers} paper${counts.papers === 1 ? "" : "s"}`];
  if (codes.length) items.push(`${codes.length} ${international ? "international " : ""}conference${codes.length === 1 ? "" : "s"}`);
  return [...items, ...series, ...codes];
}

/** Research interests — chips only while content.ts lists some. */
export const researchInterests = (): string[] => player.researchInterests.filter(known);

// ── the research route (illustrative): from the school to the conference city ─────────────────────────────────────
// Coordinates from the PART 9 brief; the route exists only while a paper's host names Hanoi (R1: nothing borrowed —
// the PM2.5 paper's host stays "Coming soon").
const PLACES = {
  school: { lat: 26.84, lon: 75.56 }, // Manipal University Jaipur
  hanoi: { lat: 21.03, lon: 105.83 }, // SCI-2026 · Swinburne Vietnam, Hanoi
} as const;

export type RoutePoint = LatLon & { label: string; detail?: string };
export type ResearchRoute = { from: RoutePoint; to: RoutePoint; caption: string };

export function researchRoute(): ResearchRoute | null {
  const hosted = research.find((r) => known(r.host) && /\bhanoi\b/i.test(r.host));
  if (!hosted) return null;
  const code = hosted.venue.match(CONFERENCE)?.[0] ?? hosted.venue;
  const series = hosted.venue.match(SERIES)?.[1];
  const detail = [known(hosted.dates) ? hosted.dates : null, series ?? null].filter(Boolean).join(" · ");
  return {
    from: { ...PLACES.school, label: education.school },
    to: { ...PLACES.hanoi, label: `Presented at ${code}`, detail },
    caption: `From ${education.school} to ${code}, ${hosted.host}. Presented at ${code}${detail ? ` · ${detail}` : ""}.`,
  };
}

/** A flat dot-matrix map of the route's region (no WebGL, LOW tier, no JS), from the bundled Natural Earth land. */
export function routeMap() {
  const route = researchRoute();
  if (!route) return null;
  const geo = JSON.parse(readFileSync(path.join(process.cwd(), "public/data/ne_110m_land.geojson"), "utf8"));
  const onLand = landTester(geo);
  const box = { lon0: 60, lon1: 118, lat0: 2, lat1: 40 };
  const step = 1;
  const cols = Math.round((box.lon1 - box.lon0) / step);
  const rows = Math.round((box.lat1 - box.lat0) / step);
  let land = "";
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      if (onLand(box.lon0 + (i + 0.5) * step, box.lat1 - (j + 0.5) * step)) land += `M${i} ${j}h.8v.8h-.8z`;
    }
  const project = (p: LatLon) => ({ x: Math.round(((p.lon - box.lon0) / step) * 100) / 100, y: Math.round(((box.lat1 - p.lat) / step) * 100) / 100 });
  const from = project(route.from);
  const to = project(route.to);
  // the great circle is nearly straight on this map — lift it into an arc so it reads as a route
  const pts = greatCircleLatLon(route.from, route.to, 32).map(project);
  const lift = Math.hypot(to.x - from.x, to.y - from.y) * 0.32;
  const arc = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${(p.y - lift * Math.sin((Math.PI * i) / (pts.length - 1))).toFixed(2)}`).join("");
  return { w: cols, h: rows, land, from, to, arc, route };
}
