// The Green Room catalog — the curated library the app ships with.
//
// The brutalist "call-sheet" flow opens on a featured sample (The Last Shift)
// and a shelf of public-domain plays. Each entry is a self-contained room: a
// WorkScript the model is grounded in plus the cast derived from it — the same
// shape add-script.tsx produces for a pasted screenplay, so every downstream
// screen (detail / chat / call / video) treats catalog rooms and pasted rooms
// identically.

import type { Character, Room, WorkScript } from "./characters";
import { SCRIPT, CHARACTERS } from "./characters";

import { HAMLET } from "./works/hamlet";
import { A_DOLLS_HOUSE } from "./works/a-dolls-house";
import { EARNEST } from "./works/earnest";
import { CYRANO } from "./works/cyrano";
import { PYGMALION } from "./works/pygmalion";
import { CALIGARI } from "./works/caligari";
import { NOSFERATU } from "./works/nosferatu";

/** A library entry: a grounded room plus the display metadata the call-sheet
 *  library / detail screens render (eyebrow + meta line). `script` and `cast`
 *  are exactly what the chat/voice routes consume. */
export type CatalogEntry = {
  /** Stable slug, e.g. "hamlet". */
  id: string;
  /** Mono eyebrow over the title, e.g. "Public domain · tragedy". */
  eyebrow: string;
  /** Mono meta line, e.g. "c. 1600 · William Shakespeare". */
  meta: string;
  script: WorkScript;
  cast: Character[];
};

// The Arqo-original sample, repackaged from the still-being-written demo in
// characters.ts. It's the "Featured · talk now" card — finished enough to talk
// to, deliberately full of gaps.
export const LAST_SHIFT: CatalogEntry = {
  id: "last-shift",
  eyebrow: "Arqo original · sample",
  meta: "Arqo original · short film",
  script: {
    title: SCRIPT.title,
    format: SCRIPT.format,
    logline: SCRIPT.logline,
    text: SCRIPT.text,
  },
  cast: CHARACTERS,
};

/** The featured room shown first in the library ("talk now"). */
export const FEATURED: CatalogEntry = LAST_SHIFT;

/** The public-domain shelf, in the order the prototype lists them. */
export const PUBLIC_DOMAIN: CatalogEntry[] = [
  HAMLET,
  A_DOLLS_HOUSE,
  EARNEST,
  CYRANO,
  PYGMALION,
  CALIGARI,
  NOSFERATU,
];

/** Everything in the catalog, featured first. */
export const WORKS: CatalogEntry[] = [FEATURED, ...PUBLIC_DOMAIN];

export function getWork(id: string): CatalogEntry | undefined {
  return WORKS.find((w) => w.id === id);
}

export function getCharacterIn(
  workId: string,
  charId: string,
): Character | undefined {
  return getWork(workId)?.cast.find((c) => c.id === charId);
}

/** Collapse a catalog entry to the room shape the shell/localStorage use. */
export function toRoom(entry: CatalogEntry): Room {
  return { script: entry.script, cast: entry.cast };
}

/** Cover-tile initial — first significant letter of the title (skips a leading
 *  "The " / "A "). */
export function coverInitial(title: string): string {
  const t = title.replace(/^(the|a)\s+/i, "");
  return (t[0] ?? title[0] ?? "?").toUpperCase();
}
