import type { SkillNode } from "@/content/skills";
import type { Tone } from "@/content/derived";
import type { PixelIconName } from "@/components/ui/pixel-icons";
import { PixelUse, SkillIcon, SkillName } from "./SkillParts";

export type InventoryType = { id: string; name: string; label: string; tone: Tone; pixel: PixelIconName; count: number };

/** The grid is padded with empty slots to a multiple of 8 (desktop columns) — 8 is also a multiple of 4 (phones). */
const padTo = (n: number, cols: number) => (cols - (n % cols)) % cols;

/**
 * INVENTORY · Skills grid (PART 13): an RPG slot grid (8 columns, 4 on phones) with type-colored frames, type filters,
 * a search that understands aliases ("js", "postgres", "ml"), and the LOADOUT — three equip slots that look for where
 * the equipped skills were used together. Runtime-only (`data-needs-js`); the island wires it.
 */
export function Inventory({ nodes, types }: { nodes: SkillNode[]; types: InventoryType[] }) {
  return (
    <div className="inv" data-inv="">
      <div className="inv__bar">
        <div className="inv-filters" role="group" aria-label="Show item type">
          <button type="button" className="inv-filter" data-inv-filter="all" aria-pressed="true">
            All <span className="inv-filter__n">{nodes.length}</span>
          </button>
          {types.map((t) => (
            <button key={t.id} type="button" className="inv-filter" data-inv-filter={t.id} data-tone={t.tone} aria-pressed="false">
              <span className="inv-filter__icon" aria-hidden="true">
                <PixelUse name={t.pixel} size={14} />
              </span>
              {t.name}
              <span className="inv-filter__plain"> · {t.label}</span> <span className="inv-filter__n">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="inv-search">
          <label htmlFor="inv-q" className="inv-search__label">
            Search
          </label>
          <input id="inv-q" type="search" className="inv-search__input" placeholder="try js, postgres, ml" autoComplete="off" spellCheck={false} data-inv-search="" />
          <p className="inv-search__status" data-inv-status="" aria-live="polite" />
        </div>
      </div>
      <p className="inv-jd" data-inv-jd="" hidden>
        <span data-inv-jd-text="" />{" "}
        <button type="button" className="inv-jd__clear" data-inv-jd-clear="">
          Clear highlight
        </button>
      </p>
      <div className="inv__main">
        <ul className="inv-grid" data-inv-grid="" aria-label={`Inventory: ${nodes.length} skills. Choose one to equip it.`}>
          {nodes.map((n, i) => (
            <li key={n.anchor} className="inv-slot" data-slot={n.index} data-type={n.type} data-tone={n.tone} data-signature={n.signature ? "" : undefined}>
              <button
                type="button"
                className="inv-slot__btn"
                data-slot-btn={n.index}
                aria-pressed="false"
                aria-describedby={`${n.anchor}-card`}
                tabIndex={i === 0 ? 0 : -1}
                data-cursor-label="EQUIP"
              >
                <span className="inv-slot__icon" aria-hidden="true">
                  <SkillIcon node={n} />
                </span>
                <SkillName node={n} className="inv-slot__name" />
              </button>
            </li>
          ))}
          {Array.from({ length: padTo(nodes.length, 8) }, (_, i) => (
            <li key={`empty-${i}`} className="inv-slot inv-slot--empty" aria-hidden="true" />
          ))}
        </ul>
        <aside className="inv-side" aria-label="Loadout and item details">
          <section className="loadout" aria-labelledby="loadout-title">
            <h3 id="loadout-title" className="loadout__title">
              Loadout <span className="loadout__plain">· Combo finder</span>
            </h3>
            <p className="loadout__hint">Equip up to three skills to see where Akshat used them together.</p>
            <ol className="loadout__slots" data-loadout="">
              {[1, 2, 3].map((k) => (
                <li key={k} className="loadout-slot" data-loadout-slot={k - 1}>
                  <span className="loadout-slot__empty">Empty slot {k}</span>
                </li>
              ))}
            </ol>
            <div className="combo" data-combo="" aria-live="polite">
              <p className="combo__idle">Equip two skills to look for a combo.</p>
            </div>
            <button type="button" className="loadout__clear" data-loadout-clear="" hidden>
              Unequip all
            </button>
          </section>
          <div className="inv-detail" data-inv-detail="" aria-hidden="true">
            <p className="inv-detail__idle">Hover or focus a slot to inspect it.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
