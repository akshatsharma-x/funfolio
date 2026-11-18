// World 7 · TROPHY ROOM (PART 14): what the Hall of Fame, the certificate cards and the capsule machine show, computed
// on the server from content.ts (R1). Server-only. Every honor's text is shown exactly as written; certificates render
// whatever fields they have (0, 1 or many cards); the capsule machine only ever deals these same items.

import { certificates, honors, type TrophyKind } from "./content";
import { known } from "./derived";

export type HallHonor = {
  id: string;
  title: string;
  year: string;
  org: string;
  /** Null when content has no detail line. */
  detail: string | null;
  kind: TrophyKind;
  /** The trophy's plain name, for the 3D view's description ("a cup", R9). */
  shape: string;
};

const SHAPE: Record<TrophyKind, string> = { cup: "Cup", medal: "Medal on a ribbon", star: "Star plaque", scroll: "Rolled scroll" };

export const hallHonors = (): HallHonor[] =>
  honors.map((h) => ({ id: h.id, title: h.title, year: h.year, org: h.org, detail: known(h.detail) ? h.detail : null, kind: h.trophy, shape: SHAPE[h.trophy] }));

export type CertCard = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  /** Issuer initials for the card's emblem (text — never an issuer's logo, R4). */
  monogram: string;
  credentialId: string | null;
  skills: string[];
  verify: string | null;
};

const MINOR = new Set(["of", "the", "and", "for", "&", "in", "on", "at", "a"]);
/** "Amazon Web Services" → "AWS" · "Coursera" → "CO" · "IBM" → "IBM". */
export const monogramOf = (issuer: string): string => {
  const words = issuer
    .replace(/[()]/g, " ")
    .split(/[\s\-–—/]+/)
    .filter((w) => w && !MINOR.has(w.toLowerCase()));
  if (words.length === 0) return "★";
  if (words.length === 1) {
    const w = words[0];
    return w.length <= 4 && w === w.toUpperCase() ? w : w.slice(0, 2).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

export const certCards = (): CertCard[] =>
  certificates.map((c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    date: c.date,
    monogram: monogramOf(c.issuer),
    credentialId: c.credentialId && known(c.credentialId) ? c.credentialId : null,
    skills: (c.skills ?? []).filter(known),
    verify: c.credentialUrl && known(c.credentialUrl) ? c.credentialUrl : null,
  }));
