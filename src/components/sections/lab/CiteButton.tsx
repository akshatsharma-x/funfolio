"use client";

import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { command } from "@/lib/commands";

/** [Cite · BibTeX] → copies the BibTeX + "Item acquired: Citation"; disabled with "BibTeX coming soon" until it exists. */
export function CiteButton({ bibtex }: { bibtex: string | null }) {
  if (!bibtex)
    return (
      <span className="cite-soon">
        <ArcadeButton size="sm" variant="secondary" disabled>
          ❝ Cite · BibTeX
        </ArcadeButton>
        <span className="cite-soon__note">BibTeX coming soon</span>
      </span>
    );
  return (
    <ArcadeButton
      size="sm"
      variant="secondary"
      data-fx-skip=""
      onClick={() => {
        void navigator.clipboard?.writeText(bibtex).then(
          () => command({ type: "item", title: "Citation", detail: "BibTeX copied to the clipboard" }),
          () => command({ type: "item", title: "Citation", detail: "Copy blocked — select the BibTeX in the scroll" }),
        );
      }}
    >
      ❝ Cite · BibTeX
    </ArcadeButton>
  );
}
