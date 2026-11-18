import type { CSSProperties } from "react";
import { ArcadeButton } from "@/components/ui/ArcadeButton";

// a pile of capsules at the bottom of the dome (% of the dome; inside the circle), rotations and colors fixed so the
// server and the client agree
const PILE: { x: number; y: number; r: number; c: string }[] = [
  { x: 26, y: 76, r: -18, c: "#FF8A1F" },
  { x: 42, y: 77, r: 24, c: "#FFC83D" },
  { x: 58, y: 77, r: -32, c: "#FF4D4D" },
  { x: 74, y: 76, r: 12, c: "#FF3D8B" },
  { x: 18, y: 60, r: 36, c: "#FFD23F" },
  { x: 34, y: 61, r: -8, c: "#A78BFA" },
  { x: 50, y: 61, r: 28, c: "#FF8A1F" },
  { x: 66, y: 61, r: -26, c: "#FFC83D" },
  { x: 82, y: 60, r: 8, c: "#FF4D4D" },
  { x: 26, y: 45, r: -36, c: "#FFC83D" },
  { x: 42, y: 45, r: 16, c: "#FF3D8B" },
  { x: 58, y: 45, r: -12, c: "#FFD23F" },
  { x: 74, y: 45, r: 30, c: "#FF8A1F" },
  { x: 34, y: 30, r: 20, c: "#FF4D4D" },
  { x: 50, y: 29, r: -24, c: "#A78BFA" },
  { x: 66, y: 30, r: 6, c: "#FFC83D" },
];

/**
 * CAPSULE MACHINE (PART 14): an original capsule-toy machine — drag the crank a full turn (or press TURN): the
 * capsules jostle, one rolls out, bounces in the tray and pops open on an honor or a certificate from the lists above
 * (a fun way to browse them, never new content). One capsule in five holds coin #11 (once). The art is decoration
 * (aria-hidden); TURN is the keyboard path, the prize is announced. Runtime-only (TrophiesFx).
 */
export function CapsuleMachine({ items }: { items: number }) {
  return (
    <section className="capsules" aria-labelledby="capsules-title" data-needs-js="" data-speedrun="hide">
      <h3 id="capsules-title" className="trophy-h">
        Capsule machine <span className="trophy-h__plain">· Browse honors &amp; certificates</span>
      </h3>
      <p className="trophy-sub">
        Turn the crank: every capsule holds one of the {items} items above. Something else is rattling around in there too.
      </p>
      <div className="capsules__play" data-capsule-machine="" data-coin="" data-coin-id="capsule-machine">
        <div className="machine" aria-hidden="true">
          <div className="machine__dome">
            <span className="machine__glass" />
            {PILE.map((p, i) => (
              <span key={i} className="cap" style={{ "--x": `${p.x}%`, "--y": `${p.y}%`, "--r": `${p.r}deg`, "--c": p.c } as CSSProperties} />
            ))}
          </div>
          <div className="machine__neck" />
          <div className="machine__body">
            <span className="machine__plate">1 turn · 1 capsule</span>
            <span className="machine__crank" data-crank="">
              <span className="machine__crank-arm">
                <span className="machine__crank-grip" />
              </span>
              <span className="machine__crank-hub" />
            </span>
            <span className="machine__chute">
              <span className="machine__flap" />
            </span>
          </div>
          <div className="machine__tray">
            <span className="capsule-out" data-capsule-out="">
              <span className="capsule-out__top" />
              <span className="capsule-out__bottom" />
            </span>
          </div>
        </div>
        <div className="capsules__side">
          <div className="capsules__controls">
            <ArcadeButton type="button" icon="coin" sfx={false} data-capsule-turn="">
              Turn the crank
            </ArcadeButton>
            <p className="capsules__hint">…or grab the crank and wind it around.</p>
          </div>
          <div className="capsule-prize" data-capsule-prize="" hidden>
            <span className="capsule-prize__flash" aria-hidden="true" />
            <p className="capsule-prize__rarity" data-capsule-rarity="" />
            <div className="capsule-prize__card" data-capsule-card="" />
          </div>
        </div>
      </div>
    </section>
  );
}
