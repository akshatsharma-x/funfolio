import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { InventoryType } from "./Inventory";
import { PixelUse } from "./SkillParts";

/**
 * JD SCANNER · "Party Compatibility Check" (PART 13): paste a job description, SCAN → a laser sweeps the page and the
 * island lists the matching skills by type, the bonus perks (skills a neighbour implies: "containers" → Docker), what
 * the résumé shows outside the Skill Tree, and what isn't on the save file yet. Counts only — never a percentage.
 * 100% in the browser (src/lib/skills-index.ts, bundled with the island): no API, no upload, works offline (R10).
 * The result skeleton is server-rendered and filled with DOM APIs — the pasted text is never injected as HTML.
 */
export function JdScanner({ types }: { types: InventoryType[] }) {
  return (
    <div className="jd" data-jd="">
      <div className="jd__head">
        <h3 className="jd__title">
          Party compatibility check <span className="jd__plain">· Job description scanner</span>
        </h3>
        <p className="jd__privacy">
          <PixelIcon name="lock" size={16} mono />
          <span>
            Runs 100% in your browser — <strong>nothing leaves your browser</strong>. No API, no upload; it even works offline.
          </span>
        </p>
      </div>
      <form className="jd__form" data-jd-form="" noValidate>
        <label htmlFor="jd-text" className="jd__label">
          Paste a job description
        </label>
        <div className="jd__paper">
          <textarea id="jd-text" name="jd" className="jd__text" rows={9} spellCheck={false} maxLength={40000} placeholder="Paste the requirements — languages, frameworks, tools…" data-jd-text="" />
          <span className="jd__laser" aria-hidden="true" data-jd-laser="" />
        </div>
        <div className="jd__actions">
          <ArcadeButton type="submit" icon="bolt" sfx={false} data-jd-scan="">
            Scan
          </ArcadeButton>
          <ArcadeButton type="button" variant="secondary" sfx="click" data-jd-sample="">
            Try a sample JD
          </ArcadeButton>
          <ArcadeButton type="button" variant="ghost" sfx="click" data-jd-clear="">
            Clear
          </ArcadeButton>
        </div>
        <p className="jd__status" data-jd-status="" />
      </form>

      <div className="jd-res" data-jd-results="" hidden>
        <div className="jd-res__head">
          <span className="jd-res__check" aria-hidden="true">
            <PixelIcon name="check" size={20} mono />
          </span>
          <h4 className="jd-res__title" tabIndex={-1} data-jd-title="" />
        </div>
        <p className="jd-res__note">Counts only — never a made-up percentage.</p>
        <div className="jd-res__groups">
          {types.map((t) => (
            <section key={t.id} className="jd-group" data-jd-group={t.id} data-tone={t.tone} aria-labelledby={`jd-g-${t.id}`} hidden>
              <h5 id={`jd-g-${t.id}`} className="jd-group__title">
                <PixelUse name={t.pixel} size={14} /> {t.name} <span className="jd-group__plain">· {t.label}</span>{" "}
                <span className="jd-group__n" data-jd-n="" />
              </h5>
              <ul className="jd-tiles" data-jd-list="" />
            </section>
          ))}
        </div>
        <section className="jd-part" data-jd-part="bonus" aria-labelledby="jd-p-bonus" hidden>
          <h5 id="jd-p-bonus" className="jd-part__title">
            Bonus perks <span data-jd-n="" />
          </h5>
          <p className="jd-part__hint">Skills the description implies without naming them.</p>
          <ul className="jd-tiles" data-jd-list="" />
        </section>
        <section className="jd-part" data-jd-part="extras" aria-labelledby="jd-p-extras" hidden>
          <h5 id="jd-p-extras" className="jd-part__title">
            Also on the save file <span data-jd-n="" />
          </h5>
          <p className="jd-part__hint">Not Skill Tree entries, but the résumé shows them.</p>
          <ul className="jd-list" data-jd-list="" />
        </section>
        <section className="jd-part jd-part--missing" data-jd-part="missing" aria-labelledby="jd-p-missing" hidden>
          <h5 id="jd-p-missing" className="jd-part__title">
            Not on the save file yet — Akshat learns fast. <span data-jd-n="" />
          </h5>
          <ul className="jd-chips" data-jd-list="" />
        </section>
        <p className="jd-res__empty" data-jd-empty="" hidden>
          No skills spotted in that text. Try pasting the requirements part of the description.
        </p>
        <ArcadeButton type="button" variant="secondary" size="sm" iconRight="sword" data-jd-show="" hidden>
          See the matches in the inventory
        </ArcadeButton>
      </div>
    </div>
  );
}
