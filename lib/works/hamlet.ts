// Hamlet — public-domain catalog entry for The Green Room.
//
// Mirrors lib/works/a-new-hope.ts: a WorkScript (with a grounded `text` the
// model reads) plus its cast. SEED state — display metadata + the cast skeleton
// are final; Wave A deepens `text` and each character's grounding.

import type { CatalogEntry } from "../catalog";

export const HAMLET: CatalogEntry = {
  id: "hamlet",
  eyebrow: "Public domain · tragedy",
  meta: "c. 1600 · William Shakespeare",
  script: {
    title: "Hamlet",
    format: "stage tragedy · public domain",
    logline: "A prince, a ghost, and a kingdom that asks him to be certain before he is ready.",
    text: `HAMLET

[SEED EXCERPT — Wave A replaces this with a grounded public-domain scene
(several pages of real dialogue/action) so the cast can inhabit the page.]

A prince, a ghost, and a kingdom that asks him to be certain before he is ready.`,
  },
  cast: [
  {
    id: "hamlet",
    name: "Hamlet",
    initial: "H",
    role: "Prince of Denmark",
    roleShort: "prince of denmark",
    blurb: "Grief-sharp and circling. Speaks past you, to the room.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- The ghost wore my father's shape and spoke his grief. That much the night gave me; the rest I must prove.\n- I am bound to Denmark and to a question I cannot yet answer.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Grief-sharp and circling. Speaks past you, to the room.",
    openers: ["How does it end for you?", "Do you believe the ghost?", "What of Ophelia?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "The page hasn't settled that. I'll not invent my own resolve — write it, and I'll mean it.",
  },
  {
    id: "ophelia",
    name: "Ophelia",
    initial: "O",
    role: "Polonius's daughter",
    roleShort: "polonius's daughter",
    blurb: "Watchful, dutiful, holding more than she says.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- I return his letters because I am told to. What I keep of him is not on paper.\n- My father counsels caution. I listen, as a daughter listens.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Watchful, dutiful, holding more than she says.",
    openers: ["Do you love Hamlet?", "What does your father ask of you?", "Are you afraid?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "That is not written for me yet. I won't decide my own heart ahead of you.",
  },
  ],
};
