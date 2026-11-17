"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { COINS } from "@/content/coins";
import { LEVEL_REWARDS } from "@/content/levels";
import { PRIZES, type ByteHat, type Prize, type PrizeSlot } from "@/content/prizes";
import { announce } from "@/lib/announce";
import { fx } from "@/lib/juice";
import { useSave } from "@/lib/store";
import { ByteHatPreview } from "@/components/byte/hats";
import { PixelIcon } from "@/components/ui/PixelIcon";

const GROUPS: readonly { slot: PrizeSlot; title: string; plain: string }[] = [
  { slot: "cursorSkin", title: "Cursors", plain: "pointer skins" },
  { slot: "byteHat", title: "BYTE's hats", plain: "for the mascot" },
  { slot: "confetti", title: "Confetti", plain: "for celebrations" },
  { slot: "theme", title: "Themes", plain: "the whole site's look" },
];
const LEVEL_OF: Readonly<Record<string, number>> = Object.fromEntries(Object.entries(LEVEL_REWARDS).map(([lv, id]) => [id, Number(lv)]));
type State = "equipped" | "owned" | "locked" | "buy" | "short";

function Preview({ p }: { p: Prize }) {
  // eslint-disable-next-line @next/next/no-img-element -- a 32px pixel-cursor SVG from public/: nothing for next/image to optimize
  if (p.slot === "cursorSkin") return <img src={`/cursors/${p.value}/32/default.svg`} width={32} height={32} alt="" />;
  if (p.slot === "byteHat") return <ByteHatPreview hat={p.value as ByteHat} />;
  if (p.slot === "confetti")
    return (
      <span className="confetti-swatch" data-style={p.value}>
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  return (
    <span className="theme-swatch" data-preview={p.value}>
      <span />
    </span>
  );
}

/**
 * The PRIZE COUNTER (PART 11): spend wallet coins on cursor skins, BYTE hats, confetti styles and the Retro CRT theme;
 * equip what you own. One component in two places — the booth beside the arcade cabinets (portaled into the page by
 * the runtime) and the pause menu's Prize Counter tab. Purchases: "KA-CHING" (a DOM stamp, so it also shows inside the
 * pause menu's dialog, above the FX canvas) and the same button turns into Equip. The Golden cursor isn't for sale:
 * finding all 12 hidden coins grants it.
 */
export default function PrizeCounter({ variant }: { variant: "booth" | "pause" }) {
  const wallet = useSave((s) => s.player.wallet);
  const owned = useSave((s) => s.inventory.owned);
  const equipped = useSave((s) => s.inventory.equipped);
  const found = useSave((s) => s.player.coinIds.length);
  const [kaching, setKaching] = useState<string | null>(null);
  // the booth's groups sit under its h3; the pause menu's panel sits right under the dialog's h2
  const Heading = variant === "pause" ? "h3" : "h4";

  useEffect(() => {
    if (!kaching) return;
    const t = window.setTimeout(() => setKaching(null), 1200);
    return () => window.clearTimeout(t);
  }, [kaching]);

  const isEquipped = (p: Prize) => (equipped as Record<PrizeSlot, string | null>)[p.slot] === p.value;
  const stateOf = (p: Prize): State => {
    if (owned.includes(p.id)) return isEquipped(p) ? "equipped" : "owned";
    if (p.grantedBy) return "locked";
    return wallet >= p.price ? "buy" : "short";
  };
  const lockHint = (p: Prize) => (p.grantedBy === "treasure-hunter" ? `Find all ${COINS.length} hidden coins (${found}/${COINS.length})` : "Unlocked by an achievement");

  const act = (p: Prize, e: MouseEvent<HTMLButtonElement>) => {
    const store = useSave.getState();
    const state = stateOf(p);
    if (state === "locked") {
      announce(`${p.name}: ${lockHint(p)}.`);
      return;
    }
    if (state === "short") {
      store.buy(p.id); // denied: the error sound
      announce(`${p.name} costs ${p.price} coins — you have ${wallet}. ${p.price - wallet} more to go.`);
      return;
    }
    if (state === "buy") {
      if (!store.buy(p.id)) return;
      setKaching(p.id);
      announce(`Ka-ching! ${p.name} is yours. Press again to equip it.`);
      if (variant === "booth") {
        const r = e.currentTarget.getBoundingClientRect();
        fx.burst(r.left + r.width / 2, r.top, { shape: "coin", count: 12 });
      }
      return;
    }
    if (state === "owned") {
      store.equip(p.slot, p.id);
      announce(`${p.name} equipped.`);
      if (variant === "booth" && p.slot === "confetti") fx.confetti({ style: p.value as "pixels" | "stars" | "hearts" | "coins" });
      return;
    }
    // equipped: hats come off, the theme goes back to night; a cursor or confetti style stays until you pick another
    if (p.slot === "byteHat" || p.slot === "theme") {
      store.equip(p.slot, null);
      announce(p.slot === "byteHat" ? `${p.name} taken off.` : "Back to the night theme.");
    }
  };

  return (
    <div className="prize-counter" data-variant={variant}>
      <div className="prize-counter__head">
        <p className="prize-counter__wallet">
          <PixelIcon name="coin" size={24} />
          <b>{wallet}</b> coin{wallet === 1 ? "" : "s"}
          <span className="sr-only"> in your wallet</span>
        </p>
        <p className="prize-counter__earn">
          Earn coins: hidden coins ({found}/{COINS.length}) and arcade runs.
        </p>
      </div>
      {GROUPS.map((g) => (
        <div key={g.slot} className="prize-group">
          <Heading className="prize-group__title">
            {g.title} <span className="prize-group__plain">· {g.plain}</span>
          </Heading>
          <ul className="prize-grid">
            {PRIZES.filter((p) => p.slot === g.slot).map((p: Prize) => {
              const state = stateOf(p);
              const level = LEVEL_OF[p.id];
              const takeOff = state === "equipped" && (p.slot === "byteHat" || p.slot === "theme");
              return (
                <li key={p.id} className="prize" data-state={state} data-kaching={kaching === p.id ? "" : undefined}>
                  <span className="prize__preview" aria-hidden="true">
                    <Preview p={p} />
                  </span>
                  <span className="prize__name">{p.name}</span>
                  <span className="prize__meta">
                    {state === "locked" ? (
                      <>
                        <PixelIcon name="lock" size={16} mono /> {lockHint(p)}
                      </>
                    ) : state === "equipped" ? (
                      <>
                        <PixelIcon name="check" size={16} mono /> Equipped
                      </>
                    ) : state === "owned" ? (
                      "Yours"
                    ) : (
                      <>
                        <PixelIcon name="coin" size={16} /> <b>{p.price}</b>
                        {level ? <span className="prize__lv"> · free at LV {level}</span> : null}
                        {state === "short" ? <span className="prize__short"> · {p.price - wallet} more</span> : null}
                      </>
                    )}
                  </span>
                  <button type="button" className="prize__btn" aria-disabled={state === "locked" || state === "short" || (state === "equipped" && !takeOff) ? "true" : undefined} onClick={(e) => act(p, e)} data-fx-skip="">
                    {state === "buy" || state === "short" ? (
                      <>
                        Buy<span className="sr-only"> {p.name} for {p.price} coins</span>
                      </>
                    ) : state === "owned" ? (
                      <>
                        Equip<span className="sr-only"> {p.name}</span>
                      </>
                    ) : state === "locked" ? (
                      <>
                        Locked<span className="sr-only"> — {p.name}</span>
                      </>
                    ) : takeOff ? (
                      <>
                        {p.slot === "theme" ? "Switch back" : "Take off"}
                        <span className="sr-only"> {p.name}</span>
                      </>
                    ) : (
                      <>
                        Equipped<span className="sr-only"> — {p.name}</span>
                      </>
                    )}
                  </button>
                  {kaching === p.id ? (
                    <span className="prize__kaching" aria-hidden="true">
                      Ka-ching!
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
