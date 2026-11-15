// Small server-rendered building blocks shared by the world sections.

import type { ReactNode } from "react";
import type { Stat } from "@/content/content";
import { known } from "@/content/derived";
import type { WorldId } from "@/content/worlds";
import { cn } from "@/lib/cn";
import { ArcadeButton } from "@/components/ui/ArcadeButton";
import { Chip } from "@/components/ui/Chip";
import { Soon } from "@/components/ui/ComingSoon";
import { NumberRoll } from "@/components/ui/NumberRoll";

/** A world on the page: id for navigation, data-world for its lead color (R8), labelled by its heading. */
export function WorldSection({
  id,
  world,
  labelledBy,
  className,
  children,
}: {
  id: string;
  world: WorldId;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-world={world} aria-labelledby={labelledBy} className={cn("relative scroll-mt-4 py-20 md:py-28", className)}>
      <div className="shell">{children}</div>
    </section>
  );
}

/** Stat tiles. Values render exactly as written; ones containing digits roll in (NumberRoll). */
export function StatList({ stats, label = "Stats" }: { stats: Stat[]; label?: string }) {
  if (stats.length === 0) return null;
  return (
    <dl aria-label={label} className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border-2 border-line bg-surface-2 px-4 py-3">
          <dt className="font-pixel text-xs uppercase tracking-wider text-muted">{s.label}</dt>
          <dd className="mt-1 font-display text-lg font-bold">{/\d/.test(s.value) ? <NumberRoll value={s.value} /> : s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StackList({ items, label = "Stack" }: { items: string[]; label?: string }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="read grid list-disc gap-2 pl-5 marker:text-world-fg">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  );
}

/** Original pixel-monogram "guild emblem" (R4: no official logos). Decorative — the company name is the heading. */
export function Emblem({ text }: { text: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-14 flex-none place-items-center border-[3px] border-ink bg-world font-pixel text-xl font-bold text-ink clip-px-md"
    >
      {text}
    </span>
  );
}

/** External link, or "Coming soon" while the URL is TODO. */
export function LinkOrSoon({ href, children }: { href: string; children: ReactNode }) {
  if (!known(href)) return <Soon />;
  return (
    <a href={href} className="font-semibold underline">
      {children}
    </a>
  );
}

/** SAVE FILE · Résumé — disabled "Coming soon" until the PDF exists in public/ (checked at build time). */
export function SaveFileButton({ href, available, size = "lg" }: { href: string; available: boolean; size?: "md" | "lg" }) {
  if (!available) {
    return (
      <span className="inline-flex flex-wrap items-center gap-3">
        <ArcadeButton variant="secondary" size={size} icon="lock" disabled>
          Save file · Résumé
        </ArcadeButton>
        <Soon />
      </span>
    );
  }
  return (
    <ArcadeButton href={href} download variant="secondary" size={size} icon="chest">
      Save file · Résumé
    </ArcadeButton>
  );
}

/** Label/value rows (dl). Values may be "Coming soon". */
export function InfoList({ rows, className }: { rows: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]", className)}>
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="font-pixel text-sm uppercase tracking-wider text-muted">{r.label}</dt>
          <dd className="min-w-0">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
