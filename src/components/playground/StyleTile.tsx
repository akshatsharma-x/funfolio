import type { ReactNode } from "react";
import { education, experience, player, projects } from "@/content/content";
import { CATEGORY_LABEL } from "@/content/derived";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { StickerCard } from "@/components/ui/StickerCard";
import { Emblem } from "@/components/sections/parts";
import { BytePlaceholder } from "./BytePlaceholder";
import { ContrastSample } from "./ContrastSample";

const FILLS = [
  { name: "pink", value: "#ff3d8b" },
  { name: "cyan", value: "#22d3ee" },
  { name: "lime", value: "#b6ff3b" },
  { name: "yellow", value: "#ffd23f" },
  { name: "orange", value: "#ff8a1f" },
  { name: "violet", value: "var(--fill-violet)" },
  { name: "mint", value: "#2ee59d" },
  { name: "red", value: "#ff4d4d" },
  { name: "gold", value: "#ffc83d" },
  { name: "world", value: "var(--world)" },
];
const ACCENTS = ["pink", "cyan", "lime", "yellow", "orange", "violet", "mint", "red", "gold"];
const SURFACES = ["bg", "surface", "surface-2"];

/** Style tile: measured palette contrast, type scale, sample quest card, cartridge label, BYTE placeholder. */
export function StyleTile() {
  const quest = experience[0];
  const cart = projects[0];
  const firstName = player.name.split(" ")[0];

  return (
    <section aria-labelledby="tile-title" className="shell grid gap-8 py-12">
      <h2 id="tile-title" className="text-2xl">
        Style tile
      </h2>

      <StickerCard as="section" aria-labelledby="tile-fills" bodyClassName="grid gap-4">
        <h3 id="tile-fills" className="text-lg">
          Fills carry ink text (every theme)
        </h3>
        <ul className="flex flex-wrap gap-3">
          {FILLS.map((f) => (
            <li key={f.name}>
              <ContrastSample fg="var(--ink)" bg={f.value} label={f.name} />
            </li>
          ))}
        </ul>
      </StickerCard>

      <StickerCard as="section" aria-labelledby="tile-text" bodyClassName="grid gap-4">
        <h3 id="tile-text" className="text-lg">
          Accent text on this theme&apos;s surfaces
        </h3>
        <p className="read text-sm text-muted">
          Small text needs 4.5:1, large text 3:1. In the day theme the deep pink/lime/yellow/orange drop below 4.5:1 on
          surface-2, so that column is rendered as large text — the rule is: deep accents on surface-2 = large text only.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="font-pixel text-xs uppercase tracking-wider text-muted">
                <th scope="col">Accent</th>
                {SURFACES.map((s) => (
                  <th key={s} scope="col">
                    on {s}
                    {s === "surface-2" ? " · large text" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCENTS.map((a) => (
                <tr key={a}>
                  <th scope="row" className="pr-4 font-mono text-sm font-normal">
                    --fg-{a}
                  </th>
                  {SURFACES.map((s) => (
                    <td key={s} className="pr-4">
                      <ContrastSample fg={`var(--fg-${a})`} bg={`var(--${s})`} label={a} large={s === "surface-2"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StickerCard>

      <StickerCard as="section" aria-labelledby="tile-type" bodyClassName="grid gap-5">
        <h3 id="tile-type" className="text-lg">
          Type scale · Unbounded · Pixelify Sans · DM Sans · JetBrains Mono
        </h3>
        <dl className="grid gap-4">
          <TypeRow label="hero 72–152 · display 900">
            <span className="text-hero font-black uppercase text-rainbow">{firstName}</span>
          </TypeRow>
          <TypeRow label="2xl 40–48 · display">
            <span className="text-2xl font-black uppercase text-world-fg">Quest Log</span>
          </TypeRow>
          <TypeRow label="xl 28–32 · display">
            <span className="font-display text-xl font-bold">{player.tagline}</span>
          </TypeRow>
          <TypeRow label="lg 20–22 · body 600">
            <span className="text-lg font-semibold">{player.status}</span>
          </TypeRow>
          <TypeRow label="base 16–18 · body">
            <span className="read block">{quest.bullets[0]}</span>
          </TypeRow>
          <TypeRow label="sm 14 · body">
            <span className="text-sm">{education.school}</span>
          </TypeRow>
          <TypeRow label="pixel · HUD / buttons">
            <span className="font-pixel text-lg font-medium uppercase tracking-wider">Press start · Save file · Eject · Launch</span>
          </TypeRow>
          <TypeRow label="mono · chips / terminal">
            <span className="font-mono text-sm">{quest.stack.slice(0, 3).join(" · ")}</span>
          </TypeRow>
        </dl>
      </StickerCard>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <StickerCard
          tilt
          peel={<p className="font-mono text-xs">git commit -m &quot;peeled the sticker&quot;</p>}
          peelLabel="Peek under the sample quest card"
          aria-label="Sample quest card"
          bodyClassName="grid gap-4"
        >
          <div className="flex items-start gap-3">
            <div data-world="quests">
              <Emblem text={quest.emblem} />
            </div>
            <div className="grid gap-1">
              <p className="font-display text-lg font-bold">{quest.company}</p>
              <p className="text-sm font-semibold">{quest.role}</p>
              <p className="text-sm text-muted">{quest.period}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {quest.stats.slice(0, 2).map((s) => (
              <div key={s.label}>
                <dt className="font-pixel text-xs uppercase tracking-wider text-muted">{s.label}</dt>
                <dd className="font-display font-bold">
                  <NumberRoll value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
          <ul className="flex flex-wrap gap-2" aria-label="Stack sample">
            {quest.stack.slice(0, 4).map((s) => (
              <li key={s}>
                <Chip>{s}</Chip>
              </li>
            ))}
          </ul>
        </StickerCard>

        <figure className="grid justify-items-center gap-3" data-world="vault">
          <div className="relative w-60 rounded-b-lg rounded-t-[22px] border-[3px] border-ink bg-world p-3 pt-7 shadow-[0_6px_0_var(--ink)]">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-2.5 h-2.5 bg-[repeating-linear-gradient(90deg,var(--ink)_0_3px,transparent_3px_8px)] opacity-50"
            />
            <div className="grid gap-1 rounded-md border-2 border-ink bg-cream p-3 text-[#1b1530]">
              <span className="font-pixel text-xs uppercase tracking-wider">{cart.genre}</span>
              <span className="font-display text-lg font-black leading-tight">{cart.title}</span>
              <span className="text-xs">{CATEGORY_LABEL[cart.category]}</span>
            </div>
            <div aria-hidden="true" className="mx-auto mt-3 h-3 w-24 rounded-sm border-2 border-ink bg-[repeating-linear-gradient(90deg,var(--ink)_0_2px,transparent_2px_6px)]" />
          </div>
          <figcaption className="font-pixel text-xs uppercase tracking-wider text-muted">Sample cartridge label</figcaption>
        </figure>

        <figure className="grid justify-items-center gap-3">
          <div className="grid size-40 place-items-center rounded-[28px] border-[3px] border-dashed border-line">
            <BytePlaceholder size={112} />
          </div>
          <figcaption className="grid justify-items-center gap-2 font-pixel text-xs uppercase tracking-wider text-muted">
            BYTE placeholder <Badge tone="world">Antenna = --world</Badge>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function TypeRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b-2 border-line pb-3 md:grid-cols-[220px_1fr] md:items-baseline md:gap-6">
      <dt className="font-mono text-xs text-muted">{label}</dt>
      <dd className="min-w-0 overflow-hidden">{children}</dd>
    </div>
  );
}
