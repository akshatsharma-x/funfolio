import type { ReactNode } from "react";
import { experience, projects, skills } from "@/content/content";
import { ITEM_META, ITEM_TYPES } from "@/content/derived";
import { WORLDS } from "@/content/worlds";
import type { Theme } from "@/lib/prefs";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Soon, SoonPanel } from "@/components/ui/ComingSoon";
import { Meter } from "@/components/ui/Meter";
import { NumberRoll } from "@/components/ui/NumberRoll";
import { PixelFrame } from "@/components/ui/PixelFrame";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PIXEL_ICON_NAMES } from "@/components/ui/pixel-icons";
import { StickerCard } from "@/components/ui/StickerCard";
import { Tabs } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { ContrastSample } from "./ContrastSample";
import { LoadingDemo, ModalDemo } from "./Demos";

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h3 id={id} className="font-pixel text-sm uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Every UI-kit component, rendered inside one theme scope. */
export function KitShowcase({ theme }: { theme: Theme }) {
  const id = (s: string) => `${theme}-${s}`;
  const quest = experience[0];
  const usedPython = [...experience.map((e) => ({ name: e.company, stack: e.stack })), ...projects.map((p) => ({ name: p.title, stack: p.stack }))]
    .filter((x) => x.stack.includes("Python"))
    .map((x) => x.name);

  return (
    <div className="grid gap-12">
      <Block id={id("surfaces")} title="Theme surfaces · measured body-text contrast">
        <ul className="flex flex-wrap gap-4">
          {["bg", "surface", "surface-2"].flatMap((s) =>
            ["text", "muted"].map((t) => (
              <li key={`${t}-${s}`}>
                <ContrastSample fg={`var(--${t})`} bg={`var(--${s})`} label={`${t} on ${s}`} />
              </li>
            )),
          )}
        </ul>
      </Block>

      <Block id={id("buttons")} title="ArcadeButton · variants, sizes, states">
        <div className="flex flex-wrap items-center gap-4">
          <ArcadeButton icon="controller">Press start</ArcadeButton>
          <ArcadeButton variant="secondary" icon="chest">
            Save file
          </ArcadeButton>
          <ArcadeButton variant="ghost">Eject</ArcadeButton>
          <ArcadeButton variant="danger" icon="bug">
            Reset save
          </ArcadeButton>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ArcadeButton size="sm">Small</ArcadeButton>
          <ArcadeButton>Medium</ArcadeButton>
          <ArcadeButton size="lg">Large</ArcadeButton>
          <ArcadeButton shape="circle" icon="star" aria-label="Star" />
          <ArcadeButton shape="circle" size="lg" icon="coin" variant="secondary" aria-label="Insert coin" />
          <LoadingDemo />
          <ArcadeButton disabled icon="lock">
            Locked
          </ArcadeButton>
          <ArcadeButton href="#main" variant="secondary" iconRight="map">
            Link button
          </ArcadeButton>
        </div>
      </Block>

      <Block id={id("cards")} title="StickerCard · default, world, holo, tilt, peel, pressable">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <StickerCard>
            <p className="font-display font-bold">Default</p>
            <p className="text-muted">Surface fill, ink outline, hard shadow.</p>
          </StickerCard>
          <StickerCard variant="world">
            <p className="font-display font-bold">World</p>
            <p>Filled with --world; text switches to ink.</p>
          </StickerCard>
          <StickerCard variant="holo">
            <p className="font-display font-bold">Holo</p>
            <p className="text-muted">Animated foil frame for legendary items.</p>
          </StickerCard>
          <StickerCard tilt>
            <p className="font-display font-bold">Tilt</p>
            <p className="text-muted">Mouse only, ≤ 8°, with glare. Off on touch and reduced motion.</p>
          </StickerCard>
          <StickerCard peel={<p className="text-sm">A secret lives here.</p>} peelLabel={`Peek under the ${theme} peel card`}>
            <p className="font-display font-bold">Peel</p>
            <p className="text-muted">Hover or tap the corner, or Tab to it and press Enter.</p>
          </StickerCard>
          <StickerCard pressable>
            <p className="font-display font-bold">Pressable</p>
            <p className="text-muted">Press and hold: it sinks 4px like an arcade button.</p>
          </StickerCard>
        </div>
      </Block>

      <Block id={id("frame")} title="PixelFrame · Coming soon states">
        <div className="grid gap-6 md:grid-cols-2">
          <PixelFrame title="Save file">
            <p className="read">Stepped corners, ink outline and a hard shadow that follows the steps.</p>
          </PixelFrame>
          <div className="grid content-start gap-4">
            <p>
              Inline: <Soon />
            </p>
            <SoonPanel>
              <p>Block empty state.</p>
            </SoonPanel>
          </div>
        </div>
      </Block>

      <Block id={id("chips")} title="Chip (item types) · Badge">
        <ul className="flex flex-wrap gap-2" aria-label="Item type chips">
          {ITEM_TYPES.map((t) => (
            <li key={t}>
              <Chip type={t}>
                {ITEM_META[t].name} · {skills[t].label}
              </Chip>
            </li>
          ))}
          <li>
            <Chip>Neutral stack chip</Chip>
          </li>
          <li>
            <Chip holo icon="sparkle">
              Holo-foil sample
            </Chip>
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Badge tone="world">World 2B</Badge>
          <Badge tone="mint" icon="star">
            Current quest
          </Badge>
          <Badge tone="violet" icon="scroll">
            Presented
          </Badge>
          <Badge tone="gold" icon="coin">
            Coin 1/12
          </Badge>
          <Badge tone="pink">Multi-Agent RAG</Badge>
          <Badge>Neutral</Badge>
        </div>
      </Block>

      <Block id={id("overlays")} title="Tooltip · Modal">
        <div className="flex flex-wrap items-center gap-6">
          <Tooltip
            title="Python"
            typeLine={`${ITEM_META.weapons.name} · ${skills.weapons.label}`}
            body={usedPython.length > 0 ? `Used in: ${usedPython.join(", ")}.` : undefined}
          >
            <button type="button" className="chip" data-tone="pink">
              <PixelIcon name="sword" mono />
              Python (hover or focus me)
            </button>
          </Tooltip>
          <ModalDemo />
        </div>
      </Block>

      <Block id={id("tabs")} title="Tabs · sliding pixel underline">
        <Tabs
          label={`${quest.company} quest details`}
          tabs={[
            {
              id: "stats",
              label: "Stats",
              icon: "star",
              content: (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {quest.stats.map((s) => (
                    <div key={s.label}>
                      <dt className="font-pixel text-xs uppercase tracking-wider text-muted">{s.label}</dt>
                      <dd className="font-display text-lg font-bold">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
            {
              id: "stack",
              label: "Stack",
              icon: "gear",
              content: (
                <ul className="flex flex-wrap gap-2">
                  {quest.stack.map((s) => (
                    <li key={s}>
                      <Chip>{s}</Chip>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              id: "log",
              label: "Quest log",
              icon: "scroll",
              content: (
                <ul className="read grid list-disc gap-1 pl-5">
                  {quest.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      </Block>

      <Block id={id("meters")} title="Meter (demo values) · NumberRoll (real stats, rolls on scroll-in)">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4">
            <Meter label="XP · demo" value={7} max={10} valueText="7 of 10 (demo)" />
            <Meter label="Coins · demo" value={3} max={12} segments={12} tone="gold" valueText="3 of 12 (demo)" />
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {[...quest.stats, ...projects.flatMap((p) => p.stats)].slice(0, 6).map((s) => (
              <div key={s.label}>
                <dt className="font-pixel text-xs uppercase tracking-wider text-muted">{s.label}</dt>
                <dd className="font-display text-xl font-black">
                  <NumberRoll value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Block>

      <Block id={id("icons")} title={`PixelIcon · ${PIXEL_ICON_NAMES.length} original 16×16 icons (color · mono)`}>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-9">
          {PIXEL_ICON_NAMES.map((name) => (
            <li key={name} className="grid justify-items-center gap-2 rounded-xl border-2 border-line p-3">
              <PixelIcon name={name} size={48} title={name} />
              <span className="flex items-center gap-2">
                <PixelIcon name={name} />
                <PixelIcon name={name} mono />
              </span>
              <span className="font-mono text-xs">{name}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block id={id("worlds")} title="WorldHeader · every world (metaphor + plain name)">
        <div className="grid gap-x-10 md:grid-cols-2">
          {WORLDS.map((w) => (
            <div key={w.id} data-world={w.id}>
              <WorldHeader world={w.id} as="h4" id={id(`wh-${w.id}`)} />
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}
