import type { CSSProperties } from "react";
import { counts, ITEM_TYPES } from "@/content/derived";
import { TREE_H, type SkillTreeData, type TreeBranch } from "@/content/skills";
import { PlayOnView } from "@/components/ui/PlayOnView";
import { PixelUse, SkillCard, SkillIcon, SkillName } from "./SkillParts";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * TREE · Skill map (PART 13). One server-rendered DOM, three layouts (src/app/skills.css):
 *  • radial (Play Mode, a wide tree): the root in the middle, five type-colored fans of hex nodes, glowing dashed edges
 *    with data packets — positions computed at build time (src/content/skillLayout.ts);
 *  • vertical (Play Mode, narrower screens): a trunk with the branches stacked under the root;
 *  • the plain list (no JS, Speedrun Mode): headings, names and "Used in" inline.
 * Every skill is one `<li id="skill-<slug>">` — the Quest Log's and the Vault's loot links land on it in every layout.
 * Node triggers are plain text on the server; the island makes them buttons (no dead buttons without JS, #117).
 */
export function SkillTree({ tree }: { tree: SkillTreeData }) {
  return (
    <div className="sk-map">
      <PlayOnView className="sk-tree" data-radial={tree.radial ? "" : undefined} threshold={0.2} style={{ "--h": TREE_H } as Vars}>
        <p className="sr-only">Arrow keys move between skills; each one lists the roles and projects that used it.</p>
        {tree.radial ? (
          <div className="sk-edges" aria-hidden="true">
            {tree.edges.map((e, i) => (
              <i
                key={i}
                className="sk-edge"
                data-tone={e.tone ?? undefined}
                data-packet={e.packet !== null ? "" : undefined}
                style={{ "--x": e.x, "--y": e.y, "--len": e.len, "--rot": `${e.rot}deg`, "--e": `${e.delay}s`, "--pd": `${e.packet ?? 0}s` } as Vars}
              />
            ))}
          </div>
        ) : null}
        <div className="sk-root" data-needs-js="" data-speedrun="hide" style={{ "--x": tree.root.x, "--y": tree.root.y } as Vars}>
          <button type="button" className="sk-root__btn" data-sk-root="" data-cursor-label="TAP">
            <span className="sk-root__hex" aria-hidden="true" />
            <span className="sk-root__label">{tree.root.label}</span>
            <span className="sr-only">
              {" "}
              — the root of the Skill Tree: {counts.skills} skills, {ITEM_TYPES.length} item types
            </span>
          </button>
        </div>
        <ul className="sk-branches">
          {tree.branches.map((b) => (
            <Branch key={b.type} branch={b} />
          ))}
        </ul>
      </PlayOnView>
    </div>
  );
}

function Branch({ branch: b }: { branch: TreeBranch }) {
  const style = b.hub ? ({ "--hx": b.hub.x, "--hy": b.hub.y, "--p": `${b.hubPop}s` } as Vars) : undefined;
  return (
    <li className="sk-branch" data-type={b.type} data-tone={b.tone} data-fan={b.fan ?? undefined} style={style}>
      <h3 className="sk-hub" id={`skills-${b.type}`}>
        <span className="sk-hub__icon" aria-hidden="true">
          <PixelUse name={b.pixel} />
        </span>
        <span className="sk-hub__name">{b.name}</span>
        <span className="sk-hub__plain">
          <span className="sr-only"> · </span>
          {b.label} <span className="sk-hub__count">· {b.nodes.length}</span>
        </span>
      </h3>
      <ul className="sk-nodes" aria-labelledby={`skills-${b.type}`}>
        {b.nodes.map(({ node, at }) => (
          <li
            key={node.anchor}
            id={node.anchor}
            className="sk-node skill-item"
            data-skill={node.index}
            data-lane={at?.lane}
            data-signature={node.signature ? "" : undefined}
            style={at ? ({ "--x": at.x, "--y": at.y, "--e": `${at.edge}s`, "--p": `${at.pop}s` } as Vars) : undefined}
          >
            <span className="sk-node__btn" data-node={node.index} aria-describedby={`${node.anchor}-card`} data-cursor-label="INSPECT">
              {/* the pop-in animates this wrapper, never the trigger: BYTE measures the trigger's box from the start */}
              <span className="sk-node__art">
                <span className="sk-hex" aria-hidden="true">
                  <SkillIcon node={node} />
                </span>
                {node.signature ? <span className="sk-crown" aria-hidden="true" /> : null}
                <SkillName node={node} className="sk-node__name" />
              </span>
            </span>
            <SkillCard node={node} />
          </li>
        ))}
      </ul>
    </li>
  );
}
