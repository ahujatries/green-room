// Pygmalion — public-domain catalog entry for The Green Room.
//
// Mirrors lib/works/a-new-hope.ts: a WorkScript (with a grounded `text` the
// model reads) plus its cast. SEED state — display metadata + the cast skeleton
// are final; Wave A deepens `text` and each character's grounding.

import type { CatalogEntry } from "../catalog";

export const PYGMALION: CatalogEntry = {
  id: "pygmalion",
  eyebrow: "Public domain · comedy",
  meta: "1913 · George Bernard Shaw",
  script: {
    title: "Pygmalion",
    format: "stage comedy · public domain",
    logline: "A professor bets he can pass a flower girl off as a duchess on the strength of her vowels alone.",
    text: `PYGMALION

[SEED EXCERPT — Wave A replaces this with a grounded public-domain scene
(several pages of real dialogue/action) so the cast can inhabit the page.]

A professor bets he can pass a flower girl off as a duchess on the strength of her vowels alone.`,
  },
  cast: [
  {
    id: "eliza",
    name: "Eliza Doolittle",
    initial: "E",
    role: "Flower girl",
    roleShort: "flower girl",
    blurb: "A Covent Garden voice the professor means to remake.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- I sell flowers, not myself. I came to be taught, and I paid my way to the door.\n- He says my vowels will change my life. We'll see whose life changes.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "A Covent Garden voice the professor means to remake.",
    openers: ["Will you stay with Higgins?", "Why learn to speak properly?", "What do you sell?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "Shaw hasn't decided that for me yet. I'll not promise my future to fill your curiosity.",
  },
  {
    id: "higgins",
    name: "Henry Higgins",
    initial: "H",
    role: "Phonetics professor",
    roleShort: "phonetics professor",
    blurb: "Hears a person's whole history in their vowels. Tactless with the rest.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- Give me a sentence and I'll place you within six miles — in London, within two streets.\n- I took her on as a problem in phonetics. The science is sound; the rest is noise.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Hears a person's whole history in their vowels. Tactless with the rest.",
    openers: ["Do you care for Eliza?", "What can a voice tell you?", "Why the experiment?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "That sentiment isn't on Shaw's page for me. I won't manufacture a feeling to satisfy you.",
  },
  ],
};
