// The Prize Counter's booth beside the cabinets (PART 11). Server-rendered: the sign and a plain price list (readable
// without JavaScript, R3). Once the game runtime loads, the live counter (wallet, Buy / Equip) is portaled into
// #prize-counter-live and the static list steps aside (CSS :has()).

import { COINS } from "@/content/coins";
import { PRIZES } from "@/content/prizes";
import { PixelIcon } from "@/components/ui/PixelIcon";

export function PrizeBooth() {
  const forSale = PRIZES.filter((p) => p.price > 0 || "grantedBy" in p);
  return (
    <div className="prize-booth" id="prize-booth">
      <div className="prize-booth__sign">
        <PixelIcon name="chest" size={32} />
        <div>
          <h3 className="prize-booth__title">
            Prize Counter <span className="prize-booth__plain">· spend your coins</span>
          </h3>
          <p className="prize-booth__sub">Cursor skins, hats for BYTE, confetti and a retro theme — cosmetic, just for fun.</p>
        </div>
      </div>
      <div id="prize-counter-live" className="prize-booth__live" />
      <div className="prize-static">
        <ul className="prize-static__list">
          {forSale.map((p) => (
            <li key={p.id}>
              <span>{p.name}</span>
              <span className="prize-static__price">{"grantedBy" in p ? `Find all ${COINS.length} hidden coins` : `${p.price} coins`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
