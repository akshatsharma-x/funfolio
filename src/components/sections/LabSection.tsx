import type { CSSProperties } from "react";
import { bossIds, bosses, labStats, researchInterests, routeMap } from "@/content/lab";
import { Chip } from "@/components/ui/Chip";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { BossCard } from "./lab/BossCard";
import { GlobeStage } from "./lab/GlobeStage";
import { LabFx } from "./lab/LabFx";
import { RouteMap } from "./lab/RouteMap";
import { WorldSection } from "./parts";

/** Floating pixel "lab bubbles" (decorative): mostly in the gutters, rising on --play (idle nap, off-screen pause). */
const BUBBLES = [
  { x: 2, s: 10, d: 17, w: 0 },
  { x: 6, s: 16, d: 23, w: 6 },
  { x: 4, s: 8, d: 14, w: 11 },
  { x: 9, s: 12, d: 20, w: 3 },
  { x: 94, s: 14, d: 21, w: 2 },
  { x: 97, s: 9, d: 15, w: 8 },
  { x: 91, s: 18, d: 26, w: 13 },
  { x: 95, s: 11, d: 18, w: 5 },
  { x: 48, s: 10, d: 24, w: 9 },
  { x: 33, s: 8, d: 19, w: 15 },
  { x: 67, s: 12, d: 22, w: 4 },
  { x: 80, s: 9, d: 16, w: 10 },
];

/**
 * World 3 · THE LAB · Research & Publications — BOSS BATTLES (PART 9). A research-route globe (lazy 3D on HIGH tier,
 * a flat dot map everywhere else), then each paper as a boss you defeat. Every fact from content.ts (R1); the route is
 * shown only while a paper's host names the conference city, and the copy says "presented at", never "travelled to".
 */
export function LabSection() {
  const all = bossIds();
  const stats = labStats();
  const interests = researchInterests();
  const map = routeMap();
  return (
    <WorldSection id="lab" world="lab" labelledBy="lab-title" className="lab">
      <div className="lab-backdrop" aria-hidden="true" data-speedrun="hide">
        <span className="lab-backdrop__sheen" />
        <span className="lab-bubbles">
          {BUBBLES.map((b, i) => (
            <span key={i} className="lab-bubble" style={{ "--x": `${b.x}%`, "--s": `${b.s}px`, "--d": `${b.d}s`, "--w": `${b.w}s` } as CSSProperties} />
          ))}
        </span>
      </div>
      <div className="lab-content">
        <WorldHeader world="lab" id="lab-title">
          <p className="lab-sub">
            Boss battles <span className="lab-sub__plain">· one boss per paper</span>
          </p>
        </WorldHeader>
        <ul className="lab-stats" aria-label="Lab stats">
          {stats.map((s) => (
            <li key={s} className="lab-stats__item">
              {s}
            </li>
          ))}
        </ul>
        {map ? (
          <GlobeStage
            route={{ from: map.route.from, to: map.route.to }}
            caption={
              <>
                <span className="globe-stage__kicker">Research route · illustrative</span> {map.route.caption}
              </>
            }
          >
            <RouteMap map={map} />
          </GlobeStage>
        ) : null}
        {/* data-boss-fight: BYTE's Lab line ("Boss fights ahead…") waits for this hook (PART 4) */}
        <ol className="boss-grid" aria-label="Papers" data-boss-fight="">
          {bosses().map((b, i) => (
            <BossCard key={b.paper.id} boss={b} all={all} index={i} />
          ))}
        </ol>
        {interests.length ? (
          <section className="lab-interests" aria-labelledby="lab-interests">
            <h3 id="lab-interests" className="lab-interests__title">
              Research interests
            </h3>
            <ul className="flex flex-wrap gap-2">
              {interests.map((k) => (
                <li key={k}>
                  <Chip tone="violet" icon="sparkle">
                    {k}
                  </Chip>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <LabFx />
    </WorldSection>
  );
}
