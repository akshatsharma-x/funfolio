import { counts } from "@/content/derived";
import { cartridgeIds, cartridges, vaultTabs } from "@/content/vault";
import { PeelCoin, PeelDoodle, PeelJoke } from "@/components/ui/PeelSecrets";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { CartridgeItem, LockedCartridge } from "./vault/Cartridge";
import { Funsole } from "./vault/Funsole";
import { VaultFx } from "./vault/VaultFx";
import { WorldSection } from "./parts";

/**
 * World 4 · CARTRIDGE VAULT · Projects (PART 10): a shelf of 3D cartridges (one per project + a locked one) and the
 * FUNSOLE — insert a cartridge to read the project on its CRT. Every project's full details are server-rendered in the
 * console (R3): one at a time in Play Mode, all of them as a plain list without JS and in Speedrun Mode.
 */
export function VaultSection() {
  const carts = cartridges();
  return (
    <WorldSection id="vault" world="vault" labelledBy="vault-title">
      <WorldHeader world="vault" id="vault-title">
        <p className="text-muted">{counts.projects} projects.</p>
      </WorldHeader>
      <div className="vault" data-vault="" data-filter="all" data-carts={cartridgeIds().join(",")}>
        <div className="vault__shelf-col" data-speedrun="hide">
          <div className="vault-tabs" role="group" aria-label="Filter the cartridges">
            {vaultTabs().map((t, i) => (
              <button key={t.id} type="button" className="vault-tab" data-filter-tab={t.id} aria-pressed={i === 0} aria-label={`${t.label}: ${t.plain}`}>
                {t.label}
              </button>
            ))}
          </div>
          {/* data-cartridge: BYTE's Vault line ("Pick a cartridge. Blow on it first.") waits for this hook (PART 4) */}
          <ul className="vault-shelf" data-cartridge="" aria-label="Cartridges: arrow keys move, Enter inserts, Esc ejects">
            {carts.map((c, i) => (
              <CartridgeItem key={c.id} cart={c} first={i === 0} secret={i === 3 ? <PeelCoin id={`vault-${c.id}`} /> : i === 1 ? <PeelDoodle name="rocket" caption="Ship it." /> : <PeelJoke n={i * 2} />} />
            ))}
            <LockedCartridge />
          </ul>
          <p className="vault-hint">
            <kbd>←</kbd> <kbd>→</kbd> pick · <kbd>Enter</kbd> insert · <kbd>Esc</kbd> eject
          </p>
        </div>
        <Funsole carts={carts} />
      </div>
      <VaultFx />
    </WorldSection>
  );
}
