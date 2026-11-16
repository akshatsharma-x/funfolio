import { player } from "@/content/content";
import { known } from "@/content/derived";
import { CODE_JOKES, DOODLES, DOODLE_PALETTE, type DoodleName } from "@/content/secrets";
import { ArcadeButton } from "./ArcadeButton";
import { PixelIcon } from "./PixelIcon";

/** A code joke for a sticker peel (index wraps). */
export function PeelJoke({ n }: { n: number }) {
  return <p className="peel-joke">{CODE_JOKES[n % CODE_JOKES.length]}</p>;
}

/** A fun fact from content.ts — or a joke until Akshat adds some (R1: never invent one). */
export function PeelFact({ n }: { n: number }) {
  const fact = player.funFacts[n];
  return known(fact) ? <p className="peel-fact">{fact}</p> : <PeelJoke n={n} />;
}

/** A small pixel doodle (original art). */
export function PeelDoodle({ name, caption }: { name: DoodleName; caption?: string }) {
  const { rows, label } = DOODLES[name];
  const w = Math.max(...rows.map((r) => r.length));
  const byColor = new Map<string, string[]>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      const list = byColor.get(ch) ?? [];
      list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      byColor.set(ch, list);
      x = end;
    }
  });
  return (
    <figure className="peel-doodle">
      <svg viewBox={`0 0 ${w} ${rows.length}`} width={w * 5} height={rows.length * 5} role="img" aria-label={label} shapeRendering="crispEdges">
        {[...byColor].map(([ch, d]) => (
          <path key={ch} d={d.join("")} fill={DOODLE_PALETTE[ch] ?? DOODLE_PALETTE["#"]} />
        ))}
      </svg>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * "Rarely a coin": a spare coin stuck under the sticker. One-time per id (+1 wallet, +10 XP) — it is NOT one of the
 * 12 hidden coins. The game runtime marks it pocketed ([data-pocketed]) from the save.
 */
export function PeelCoin({ id }: { id: string }) {
  return (
    <span className="peel-coin" data-spare-coin={id}>
      <PixelIcon name="coin" size={32} />
      <span className="peel-coin__text">
        <span className="peel-coin__ready">A spare coin was stuck under here!</span>
        <span className="peel-coin__done">Pocketed. Nice find.</span>
      </span>
      <ArcadeButton size="sm" icon="coin" command={{ type: "spare-coin", id }} className="peel-coin__btn">
        Pocket it
      </ArcadeButton>
    </span>
  );
}
