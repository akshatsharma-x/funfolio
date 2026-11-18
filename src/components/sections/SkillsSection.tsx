import { skills } from "@/content/content";
import { counts, ITEM_META, ITEM_TYPES } from "@/content/derived";
import { skillNodes, skillsIndex, skillTree } from "@/content/skills";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";
import { Inventory, type InventoryType } from "./skills/Inventory";
import { JdScanner } from "./skills/JdScanner";
import { IconSprite } from "./skills/SkillParts";
import { SkillsFx } from "./skills/SkillsFx";
import { SkillTree } from "./skills/SkillTree";

const TABS = [
  { id: "tree", label: "Tree", plain: "Skill map" },
  { id: "inventory", label: "Inventory", plain: "Grid & loadout" },
  { id: "jd", label: "JD Scanner", plain: "Job description match" },
] as const;

/**
 * World 6 · SKILL TREE · Skills (PART 13). Three views behind ARIA tabs — TREE (default), INVENTORY, JD SCANNER — all
 * server-rendered; one delegated island (`SkillsFx`) plays them. Inactive panels hide only with JS; without JS and in
 * Speedrun Mode the tree shows as a plain list with "Used in" inline and the runtime-only views stay hidden.
 */
export function SkillsSection() {
  const nodes = skillNodes();
  const types: InventoryType[] = ITEM_TYPES.map((t) => ({
    id: t,
    name: ITEM_META[t].name,
    label: skills[t].label,
    tone: ITEM_META[t].tone,
    pixel: ITEM_META[t].icon,
    count: skills[t].items.length,
  }));
  return (
    <WorldSection id="skills" world="skills" labelledBy="skills-title" className="skills-world">
      <WorldHeader world="skills" id="skills-title">
        <p className="text-muted">
          {counts.skills} skills across {ITEM_TYPES.length} item types — each with the roles and projects that used it.
        </p>
      </WorldHeader>
      <IconSprite pixels={ITEM_TYPES.map((t) => ITEM_META[t].icon)} />
      <div className="skills" data-skills="">
        <div className="skills-tabs" role="tablist" aria-label="Skill Tree views" data-needs-js="" data-speedrun="hide">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`skills-tab-${t.id}`}
              className="skills-tab"
              aria-controls={`skills-${t.id}`}
              aria-selected={i === 0}
              tabIndex={i === 0 ? 0 : -1}
              data-skills-tab={t.id}
            >
              {t.label} <span className="skills-tab__plain">· {t.plain}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id="skills-tree" aria-labelledby="skills-tab-tree" className="skills-panel" data-panel="tree" data-active="">
          <SkillTree tree={skillTree()} />
        </div>
        <div role="tabpanel" id="skills-inventory" aria-labelledby="skills-tab-inventory" className="skills-panel" data-panel="inventory" data-needs-js="" data-speedrun="hide">
          <Inventory nodes={nodes} types={types} />
        </div>
        <div role="tabpanel" id="skills-jd" aria-labelledby="skills-tab-jd" className="skills-panel" data-panel="jd" data-needs-js="" data-speedrun="hide" data-jd-scanner="">
          <JdScanner types={types} />
        </div>
      </div>
      <SkillsFx index={skillsIndex()} />
    </WorldSection>
  );
}
