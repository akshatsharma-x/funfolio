"use client";

import { useRef } from "react";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { BYTE_MOODS, byte } from "@/lib/byte";
import { fx, type BurstShape } from "@/lib/juice";

const SHAPES: BurstShape[] = ["pixel", "star", "coin", "heart", "spark"];

/** Playground panel (PART 4): drives the juice kit (lib/juice) and BYTE's API (lib/byte) by hand. */
export function JuiceLab() {
  const stage = useRef<HTMLDivElement>(null);
  const center = () => {
    const r = stage.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 };
  };

  return (
    <section aria-labelledby="juice-lab" className="shell grid gap-8 py-12">
      <div className="grid gap-2">
        <h2 id="juice-lab" className="text-2xl">
          Juice kit &amp; BYTE
        </h2>
        <p className="read text-muted">
          The FX API (one overlay canvas) and the mascot&apos;s API, by hand. Effects scale with Chill / Normal / Chaos and
          switch off under reduced motion.
        </p>
      </div>
      <div
        ref={stage}
        data-juice-stage=""
        data-fx-skip=""
        className="grid min-h-32 place-items-center rounded-xl border-[3px] border-dashed border-line font-pixel text-sm uppercase tracking-wider text-muted"
      >
        Effects land here
      </div>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">fx.burst · fx.text · fx.ripple</legend>
        <div className="flex flex-wrap gap-3">
          {SHAPES.map((shape) => (
            <ArcadeButton key={shape} size="sm" variant="secondary" data-fx-skip="" onClick={() => fx.burst(center().x, center().y, { shape, count: 14 })}>
              Burst · {shape}
            </ArcadeButton>
          ))}
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => fx.text(center().x, center().y, "CRIT!", { color: "#FF3D8B", size: 24 })}>
            Floating text
          </ArcadeButton>
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => fx.ripple(center().x, center().y)}>
            Grid ripple
          </ArcadeButton>
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">fx.confetti · fx.shake · fx.hitStop · fx.pixelDissolve</legend>
        <div className="flex flex-wrap gap-3">
          {(["pixels", "stars", "hearts", "coins"] as const).map((style) => (
            <ArcadeButton key={style} size="sm" variant="secondary" data-fx-skip="" onClick={() => fx.confetti({ style })}>
              Confetti · {style}
            </ArcadeButton>
          ))}
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => fx.shake(6, stage.current)}>
            Shake the stage
          </ArcadeButton>
          <ArcadeButton
            size="sm"
            variant="secondary"
            data-fx-skip=""
            onClick={() => {
              fx.burst(center().x, center().y, { shape: "spark", count: 18, power: 1.6 });
              void fx.hitStop(80);
            }}
          >
            Hit-stop
          </ArcadeButton>
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => void fx.pixelDissolve({ direction: "down" })}>
            Pixel dissolve
          </ArcadeButton>
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-pixel text-sm uppercase tracking-wider text-muted">byte.react · byte.say · byte.point</legend>
        <div className="flex flex-wrap gap-3">
          {BYTE_MOODS.map((mood) => (
            <ArcadeButton key={mood} size="sm" variant="ghost" data-fx-skip="" onClick={() => byte.react(mood)}>
              {mood}
            </ArcadeButton>
          ))}
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => byte.say("Hello from the playground!", { mood: "happy" })}>
            Say hello
          </ArcadeButton>
          <ArcadeButton size="sm" variant="secondary" data-fx-skip="" onClick={() => byte.point("[data-juice-stage]")}>
            Point at the stage
          </ArcadeButton>
        </div>
      </fieldset>
    </section>
  );
}
