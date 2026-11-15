import { skills } from "@/content/content";
import { counts, ITEM_META, ITEM_TYPES } from "@/content/derived";
import { Chip } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { StickerCard } from "@/components/ui/StickerCard";
import { WorldHeader } from "@/components/ui/WorldHeader";
import { WorldSection } from "./parts";

/** World 6 · SKILL TREE · Skills. PART 13 adds the tree, inventory, "used in" evidence and the JD scanner. */
export function SkillsSection() {
  const signature = new Set(skills.signature);
  return (
    <WorldSection id="skills" world="skills" labelledBy="skills-title">
      <WorldHeader world="skills" id="skills-title">
        <p className="text-muted">
          {counts.skills} skills across {ITEM_TYPES.length} item types.
        </p>
      </WorldHeader>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ITEM_TYPES.map((type) => {
          const meta = ITEM_META[type];
          const category = skills[type];
          return (
            <StickerCard key={type} as="section" aria-labelledby={`skills-${type}`} bodyClassName="grid content-start gap-4">
              <h3 id={`skills-${type}`} className="flex items-center gap-3 text-lg">
                <span className="grid size-10 place-items-center rounded-lg border-2 border-ink text-ink" data-tone={meta.tone} style={{ background: "var(--tone)" }}>
                  <PixelIcon name={meta.icon} size={24} mono />
                </span>
                <span>
                  {meta.name} <span className="text-muted">·</span> {category.label}
                </span>
              </h3>
              <ul aria-label={category.label} className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <li key={item}>
                    <Chip type={type} holo={signature.has(item)}>
                      {item}
                    </Chip>
                  </li>
                ))}
              </ul>
            </StickerCard>
          );
        })}
      </div>
    </WorldSection>
  );
}
