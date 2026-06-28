// Cyrano de Bergerac — public-domain catalog entry for The Green Room.
//
// Mirrors lib/works/a-new-hope.ts: a WorkScript (with a grounded `text` the
// model reads) plus its cast. SEED state — display metadata + the cast skeleton
// are final; Wave A deepens `text` and each character's grounding.

import type { CatalogEntry } from "../catalog";

export const CYRANO: CatalogEntry = {
  id: "cyrano",
  eyebrow: "Public domain · romance",
  meta: "1897 · Edmond Rostand",
  script: {
    title: "Cyrano de Bergerac",
    format: "stage romance · public domain",
    logline: "A peerless wit lends his words to a handsomer man, then watches the woman he loves fall for his own lines.",
    text: `CYRANO DE BERGERAC

[SEED EXCERPT — Wave A replaces this with a grounded public-domain scene
(several pages of real dialogue/action) so the cast can inhabit the page.]

A peerless wit lends his words to a handsomer man, then watches the woman he loves fall for his own lines.`,
  },
  cast: [
  {
    id: "cyrano",
    name: "Cyrano",
    initial: "C",
    role: "Poet & swordsman",
    roleShort: "poet & swordsman",
    blurb: "Dazzling with words, certain of everything but his own face.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- I lend Christian my words because hers deserve the best, and he has the face to carry them.\n- My sword and my pen keep the same hours — both are how I refuse to be owed anything.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Dazzling with words, certain of everything but his own face.",
    openers: ["Do you love Roxane?", "Why write for Christian?", "What of your nose?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "Rostand hasn't let me say it plainly yet. I won't confess ahead of the page.",
  },
  ],
};
