// The Green Room catalog — the curated library the app ships with.
//
// The brutalist "call-sheet" flow opens on a single featured demo room: Star
// Wars — A New Hope. Each entry is a self-contained room: a WorkScript the
// model is grounded in plus the cast derived from it — the same shape
// add-script.tsx produces for a pasted screenplay, so every downstream screen
// (detail / chat / call / video) treats catalog rooms and pasted rooms
// identically.

import type { Character, Room, WorkScript } from "./characters";

import { A_NEW_HOPE } from "./works/a-new-hope";

/** A library entry: a grounded room plus the display metadata the call-sheet
 *  library / detail screens render (eyebrow + meta line). `script` and `cast`
 *  are exactly what the chat/voice routes consume. */
export type CatalogEntry = {
  /** Stable slug, e.g. "a-new-hope". */
  id: string;
  /** Mono eyebrow over the title, e.g. "Sample · feature film". */
  eyebrow: string;
  /** Mono meta line, e.g. "1977 · George Lucas". */
  meta: string;
  script: WorkScript;
  cast: Character[];
};

// The one demo room. Star Wars — Episode IV: A New Hope, a finished film
// grounded in its complete spoken script, so the cast gives a writer a lot back
// the moment they open the Green Room.
export const A_NEW_HOPE_ENTRY: CatalogEntry = {
  id: "a-new-hope",
  eyebrow: "Sample · feature film",
  meta: "1977 · Star Wars Episode IV",
  script: A_NEW_HOPE.script,
  cast: A_NEW_HOPE.cast,
};

/** The featured room shown first in the library ("talk now"). */
export const FEATURED: CatalogEntry = A_NEW_HOPE_ENTRY;

/** Everything in the catalog, featured first. A single demo room for now. */
export const WORKS: CatalogEntry[] = [FEATURED];

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
