import type { Metadata } from "next";
import { EggBench } from "@/components/playground/EggBench";
import { EGGS } from "@/lib/eggs";

// noindex via meta tag — never a robots.txt Disallow (docs/DECISIONS.md #15). Linked from nowhere.
export const metadata: Metadata = {
  title: "Eggs · Playground",
  robots: { index: false, follow: false },
};

/**
 * QA bench for PART 16: every easter egg from the registry (src/lib/eggs.ts) with its trigger, what it does, the
 * achievement it pays, its minimum FX level, whether it stays on in Speedrun Mode — and a Trigger button that runs
 * it through the EggProvider exactly as a find would (Speedrun Mode and reduced motion still apply).
 */
export default function EggsPage() {
  return (
    <main id="main" className="shell egg-bench" data-hud-label="Playground · Easter eggs">
      <h1 className="egg-bench__title">Easter eggs · QA bench</h1>
      <p className="egg-bench__lead">
        {EGGS.length} eggs. Trigger runs an egg now (it counts as found). In Speedrun Mode only the terminal and the right-click menu answer.
      </p>
      <EggBench eggs={EGGS.map((e) => ({ id: e.id, name: e.name, trigger: e.trigger, effect: e.effect, achievement: e.achievement ?? null, minFx: e.minFx, speedrun: !!e.speedrun }))} />
    </main>
  );
}
