import { arcadeGames } from "@/content/arcade";
import { PlayOnView } from "@/components/ui/PlayOnView";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { ArcadeFx } from "./arcade/ArcadeFx";
import { Cabinet } from "./arcade/Cabinet";
import { PrizeBooth } from "./arcade/PrizeBooth";
import { WorldSection } from "./parts";

/**
 * World 5 · BONUS STAGE: THE ARCADE · Mini-games (PART 11): a neon sign, a row of original arcade cabinets on an arcade
 * carpet — every game based on a real résumé line (src/content/arcade.ts) — and the Prize Counter's booth. Games open
 * full-screen through openGame (the runtime's game host). Hidden in Speedrun Mode (DECISIONS #29).
 */
export function ArcadeSection() {
  const games = arcadeGames();
  return (
    <WorldSection id="arcade" world="arcade" labelledBy="arcade-title">
      <WorldHeader world="arcade" id="arcade-title">
        <p className="text-muted">
          {games.filter((g) => g.ready).length} games to play now · {games.filter((g) => !g.ready).length} more on the way.
        </p>
      </WorldHeader>
      <PlayOnView className="arcade-neon">
        <p className="arcade-neon__sign">
          Every game here is based on real work. <span>Just more fun.</span>
        </p>
      </PlayOnView>
      <div className="arcade-floor">
        <ul className="arcade-row" aria-label="Arcade cabinets">
          {games.map((g) => (
            <Cabinet key={g.id} game={g} />
          ))}
        </ul>
      </div>
      <PrizeBooth />
      <ArcadeFx />
    </WorldSection>
  );
}
