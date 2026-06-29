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
import { BEE_MOVIE } from "./works/bee-movie";
import { GANGS_OF_WASSEYPUR } from "./works/gangs-of-wasseypur";
import { HAMLET } from "./works/hamlet";
import { CYRANO } from "./works/cyrano";
import { EARNEST } from "./works/earnest";
import { PYGMALION } from "./works/pygmalion";
import { A_DOLLS_HOUSE } from "./works/a-dolls-house";
import { CALIGARI } from "./works/caligari";
import { NOSFERATU } from "./works/nosferatu";

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

// Bee Movie (2007) — a finished animated comedy grounded in its full spoken
// script. Sits alongside A New Hope as a second talk-now room.
export const BEE_MOVIE_ENTRY: CatalogEntry = {
  id: "bee-movie",
  eyebrow: "Sample · feature film",
  meta: "2007 · animated comedy",
  script: BEE_MOVIE.script,
  cast: BEE_MOVIE.cast,
};

// Gangs of Wasseypur — Part 1 (2012) — Anurag Kashyap's crime epic, grounded in
// its screenplay.
export const GANGS_OF_WASSEYPUR_ENTRY: CatalogEntry = {
  id: "gangs-of-wasseypur",
  eyebrow: "Sample · feature film",
  meta: "2012 · crime drama",
  script: GANGS_OF_WASSEYPUR.script,
  cast: GANGS_OF_WASSEYPUR.cast,
};

// Public-domain rooms — full plays/films grounded in their texts. Sit in the
// library shelf below the featured film, and give the search box real depth.
function entry(
  id: string,
  meta: string,
  room: Room,
  eyebrow = "Public domain",
): CatalogEntry {
  return { id, eyebrow, meta, script: room.script, cast: room.cast };
}

export const HAMLET_ENTRY = entry("hamlet", "c.1600 · Shakespeare", HAMLET);
export const CYRANO_ENTRY = entry("cyrano", "1897 · Rostand", CYRANO);
export const EARNEST_ENTRY = entry("earnest", "1895 · Oscar Wilde", EARNEST);
export const PYGMALION_ENTRY = entry("pygmalion", "1913 · Bernard Shaw", PYGMALION);
export const A_DOLLS_HOUSE_ENTRY = entry("a-dolls-house", "1879 · Henrik Ibsen", A_DOLLS_HOUSE);
export const CALIGARI_ENTRY = entry("caligari", "1920 · silent horror", CALIGARI);
export const NOSFERATU_ENTRY = entry("nosferatu", "1922 · silent horror", NOSFERATU);

/** The featured room shown first in the library ("talk now"). */
export const FEATURED: CatalogEntry = A_NEW_HOPE_ENTRY;

/** Everything in the catalog, featured first. */
export const WORKS: CatalogEntry[] = [
  FEATURED,
  BEE_MOVIE_ENTRY,
  GANGS_OF_WASSEYPUR_ENTRY,
  HAMLET_ENTRY,
  CYRANO_ENTRY,
  EARNEST_ENTRY,
  PYGMALION_ENTRY,
  A_DOLLS_HOUSE_ENTRY,
  CALIGARI_ENTRY,
  NOSFERATU_ENTRY,
];

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
