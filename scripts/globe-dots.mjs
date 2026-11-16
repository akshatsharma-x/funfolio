// `npm run globe` — builds public/data/land-dots.json for The Lab's globe (PART 9): a Fibonacci sphere of points,
// kept where they fall on land in public/data/ne_110m_land.geojson (Natural Earth 1:110m land, public domain).
// The globe fetches only this small file from the site itself (R10); rerun after replacing the land file.

import { readFileSync, writeFileSync } from "node:fs";
import { landTester } from "../src/lib/geo.ts";

const SRC = "public/data/ne_110m_land.geojson";
const OUT = "public/data/land-dots.json";
const N = 16000; // points on the whole sphere; ~29% land

const onLand = landTester(JSON.parse(readFileSync(SRC, "utf8")));
const dots = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - ((i + 0.5) * 2) / N;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((i * golden * 180) / Math.PI) % 360) + 540) % 360 - 180;
  if (onLand(lon, lat)) dots.push(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10);
}
writeFileSync(OUT, JSON.stringify({ source: "Natural Earth 1:110m land (public domain)", sphere: N, dots }));
console.log(`${OUT}: ${dots.length / 2} land dots of ${N}`);
