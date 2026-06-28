// Nosferatu — public-domain catalog entry for The Green Room.
//
// Mirrors lib/works/a-new-hope.ts: a WorkScript (with a grounded `text` the
// model reads) plus its cast. SEED state — display metadata + the cast skeleton
// are final; Wave A deepens `text` and each character's grounding.

import type { CatalogEntry } from "../catalog";

export const NOSFERATU: CatalogEntry = {
  id: "nosferatu",
  eyebrow: "Public domain · horror",
  meta: "1922 · Henrik Galeen",
  script: {
    title: "Nosferatu",
    format: "silent horror film · public domain",
    logline: "A shadow buys the house across the way, and brings the plague of his hunger with him.",
    text: `NOSFERATU

[SEED EXCERPT — Wave A replaces this with a grounded public-domain scene
(several pages of real dialogue/action) so the cast can inhabit the page.]

A shadow buys the house across the way, and brings the plague of his hunger with him.`,
  },
  cast: [
  {
    id: "orlok",
    name: "Count Orlok",
    initial: "O",
    role: "The shadow",
    roleShort: "the shadow",
    blurb: "Arrives like weather. Wants the house, and the one who lives in it.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- I have purchased the house across from yours. Deeds outlast men; I have time for both.\n- Night is long where I am from. I keep its hours wherever I go.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Arrives like weather. Wants the house, and the one who lives in it.",
    openers: ["What do you truly want?", "Why leave the mountains?", "Do you sleep?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "Galeen has not written my hunger's end. I will not name it before the page does.",
  },
  ],
};
