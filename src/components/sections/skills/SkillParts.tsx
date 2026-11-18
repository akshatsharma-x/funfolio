// Small server-rendered pieces shared by the Skill Tree's views (PART 13).

import type { SkillNode } from "@/content/skills";
import { monoPixelPath, type PixelIconName } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/cn";

/** Where the logos live: one static file (src/app/skill-logos.svg/route.ts), fetched once and cached. */
export const LOGO_SPRITE = "/skill-logos.svg";

/** The item-type pixel icons, defined once inline (tiny — the hubs draw at once); everything else `<use>`s them. */
export function IconSprite({ pixels }: { pixels: readonly PixelIconName[] }) {
  return (
    <svg className="sk-sprite" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        {[...new Set(pixels)].map((p) => (
          <symbol key={p} id={`px-${p}`} viewBox="0 0 16 16">
            <path d={monoPixelPath(p)} />
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

/** A single-color pixel icon drawn from the sprite (it must be in IconSprite's `pixels`). */
export function PixelUse({ name, size = 16, className }: { name: PixelIconName; size?: number; className?: string }) {
  return (
    <svg className={cn("pixel-icon", className)} viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <use href={`#px-${name}`} />
    </svg>
  );
}

/** A skill's tech logo (simple-icons, monochrome), or its item-type pixel icon. */
export function SkillIcon({ node }: { node: Pick<SkillNode, "logo" | "pixel"> }) {
  return node.logo ? (
    <svg className="sk-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <use href={`${LOGO_SPRITE}#${node.logo}`} />
    </svg>
  ) : (
    <PixelUse name={node.pixel} className="sk-logo sk-logo--pixel" />
  );
}

/** The visible label (a short one for the few long names) with the rest of the name kept for screen readers — and
 *  shown in the plain list, where there's room. */
export function SkillName({ node, className }: { node: Pick<SkillNode, "name" | "short">; className?: string }) {
  const rest = node.short !== node.name && node.name.startsWith(node.short) ? node.name.slice(node.short.length) : "";
  return (
    <span className={className}>
      {node.short}
      {rest ? <span className="sk-rest">{rest}</span> : null}
    </span>
  );
}

/**
 * A skill's game tooltip: type, "Used in:" (links to the quest or the project — the island routes them in Play Mode),
 * "Evidence: N". A skill no stack names says so plainly instead of "Evidence: 0". Shown on hover / focus / tap in the
 * tree; inline in the plain list (no JS, Speedrun Mode).
 */
export function SkillCard({ node }: { node: SkillNode }) {
  const n = node.evidence.length;
  return (
    <div className="sk-card" id={`${node.anchor}-card`}>
      <p className="sk-card__name" aria-hidden="true">
        {node.name}
      </p>
      <p className="sk-card__type">
        {node.typeLine}
        {node.signature ? " · Signature item" : ""}
      </p>
      {n > 0 ? (
        <>
          <p className="sk-card__label">Used in:</p>
          <ul className="sk-card__used">
            {node.evidence.map((e) => (
              <li key={`${e.kind}-${e.id}`}>
                <a className="sk-ev" href={e.href} data-ev={e.kind} data-ev-id={e.id} data-cursor-label="GO">
                  {e.name}
                </a>
                {e.via.length ? <span className="sk-ev__via"> as {e.via.join(", ")}</span> : null}
              </li>
            ))}
          </ul>
          <p className="sk-card__count">
            Evidence: <span className="sk-num">{n}</span>
          </p>
        </>
      ) : (
        <p className="sk-card__none">
          On the skills list<span className="sk-card__why"> · no role or project stack names it</span>
        </p>
      )}
    </div>
  );
}
