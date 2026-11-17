// An arcade cabinet (PART 11): original CSS-3D cabinet — top, side and front faces, a lit marquee with the game's pixel
// logo, a CRT screen looping a tiny CSS attract mode (compositor-only, rests off screen on --play), a control panel
// (joystick + two buttons), a coin door and a FREE PLAY sticker. The whole cabinet is one Play button (visible label =
// the marquee/plaque name); the plaque under it says what real work the game is based on (R9). Not ready yet → an
// "Out of order" screen and no button.

import type { CSSProperties } from "react";
import type { ArcadeGame } from "@/content/arcade";
import { EMBLEMS } from "@/components/games/art";
import { PixelArt } from "@/components/games/PixelArt";
import { Soon } from "@/components/ui/ComingSoon";

const COLOR: Readonly<Record<string, string>> = {
  "token-squeeze": "#FF3D8B",
  "cache-hit": "#22D3EE",
  "bug-whack": "#B6FF3B",
  "rag-catcher": "#A78BFA",
  pipeline: "#FF8A1F",
  "gradient-descent": "#FFD23F",
};

function Attract({ id }: { id: string }) {
  if (id === "token-squeeze")
    return (
      <span className="att att-ts">
        <span className="att-ts__row">
          <i>please</i>
          <i className="att-ts__squeeze">really</i>
          <i>just</i>
          <i>sum</i>
        </span>
        <span className="att-ts__meter">
          <b />
        </span>
      </span>
    );
  if (id === "cache-hit")
    return (
      <span className="att att-ch">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} style={{ "--i": i } as CSSProperties} />
        ))}
      </span>
    );
  return (
    <span className="att att-bw">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ "--i": i } as CSSProperties}>
          {i === 1 || i === 5 || i === 6 ? <b /> : null}
        </i>
      ))}
    </span>
  );
}

export function Cabinet({ game }: { game: ArcadeGame }) {
  const live = game.ready;
  return (
    <li className="cab" data-cab={game.id} data-ready={live ? "" : undefined} style={{ "--cab": COLOR[game.id] ?? "#FFC83D" } as CSSProperties}>
      <div className="cab__body">
        <span className="cab__top" aria-hidden="true" />
        <span className="cab__side" aria-hidden="true" />
        <div className="cab__front" aria-hidden="true">
          <div className="cab__marquee">
            <PixelArt def={EMBLEMS[game.id]} size={36} className="cab__logo" />
            <span className="cab__title">{game.name}</span>
          </div>
          <div className="cab__bezel">
            <div className="cab__screen" data-cab-screen="">
              {live ? <Attract id={game.id} /> : <span className="cab__ooo">Out of order</span>}
            </div>
          </div>
          <div className="cab__panel">
            <span className="cab__stick">
              <span />
            </span>
            <span className="cab__buttons">
              <span />
              <span />
            </span>
          </div>
          <div className="cab__door">
            <span />
            <span />
          </div>
          <span className="cab__sticker">{live ? "Free play" : "Soon"}</span>
        </div>
        {live ? (
          <button type="button" className="cab__play" data-play-game={game.id} data-needs-js="" data-cursor-label="PLAY">
            <span className="sr-only">Play {game.name}</span>
          </button>
        ) : null}
      </div>
      <div className="cab__plaque">
        <h3 className="cab__name">{game.name}</h3>
        <p className="cab__based">
          <span className="cab__based-kicker">Based on</span> {game.basedOn}
        </p>
        {live ? null : (
          <p className="cab__soon">
            <Soon />
          </p>
        )}
      </div>
    </li>
  );
}
