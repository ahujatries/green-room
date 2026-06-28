// The Importance of Being Earnest — public-domain catalog entry for The Green Room.
//
// Mirrors lib/works/a-new-hope.ts: a WorkScript (with a grounded `text` the
// model reads) plus its cast. SEED state — display metadata + the cast skeleton
// are final; Wave A deepens `text` and each character's grounding.

import type { CatalogEntry } from "../catalog";
import { VOICES } from "../voices";

export const EARNEST: CatalogEntry = {
  id: "earnest",
  eyebrow: "Public domain · comedy",
  meta: "1895 · Oscar Wilde",
  script: {
    title: "The Importance of Being Earnest",
    format: "stage comedy · public domain",
    logline: "Two men, two false names, and a handbag that holds the whole truth.",
    text: `THE IMPORTANCE OF BEING EARNEST

[SEED EXCERPT — Wave A replaces this with a grounded public-domain scene
(several pages of real dialogue/action) so the cast can inhabit the page.]

Two men, two false names, and a handbag that holds the whole truth.`,
  },
  cast: [
  {
    id: "jack",
    name: "Jack",
    initial: "J",
    role: "Ernest in town",
    roleShort: "ernest in town",
    blurb: "Earnest by name, evasive by habit.",
    // SEED — Wave A: expand to the full settled-canon brief (memories, world,
    // the scene's beats) the way a-new-hope.ts does.
    established: `- In town I am Ernest; in the country, Jack. It has been a convenient arrangement.\n- I was found in a handbag at Victoria Station — the Brighton line.`,
    // SEED — Wave A: expand into a real voice note (diction, rhythm, guard).
    voiceNote: "Earnest by name, evasive by habit.",
    voiceId: VOICES.chris,
    openers: ["Who are you, really?", "What's in the handbag?", "Do you love Gwendolen?"],
    facets: [
      { key: "want", label: "WHAT THEY WANT", value: null },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      { key: "voice", label: "HOW THEY SPEAK", value: null },
    ],
    defer: "Wilde hasn't given me that answer yet, and I shan't invent one to fill the pause.",
  },
  ],
};
