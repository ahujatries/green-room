# Campaign — Brutalist "Call-Sheet" Green Room

**Goal:** Port the `Green Room Prototype.html` design (call-sheet brutalist: light olive
field, hard offset shadows, 2px ink borders, clap stripe, Geist/Courier Prime) into the live
Green Room app, including the full flow (entry → consent → library → detail → chat/call/video)
and the 8-title public-domain catalog, replacing the Star Wars demo as the default.

- **Repo:** `~/Documents/Claude/Projects/green-room` (ahujatries/green-room)
- **Base:** `origin/main` (#15, ElevenLabs voice). Worktree: `green-room-brutalist`, branch `feat/brutalist-call-sheet`
- **Decisions:** full flow · adopt 8-play catalog · keep BYO-script path reachable
- **Reference:** `.claude/lfg/brutalist/PROTOTYPE.html` (decoded), `DESIGN-CONTRACT.md` (token recipes)

## Spine (serial, commander-owned)
- **S1** `app/globals.css` — additive brutalist token layer + utilities (clap, hard-shadow, pop)
- **S2** `lib/catalog.ts` + `lib/characters.ts` — catalog model (CatalogEntry, WORKS, getScript), screen-flow types
- **S3** `components/green-room.tsx` — 7-screen nav state machine + brutalist shell + screen routing/contracts + stubs

## Wave A — DATA (parallel, file-disjoint `lib/works/<slug>.ts`)
Each mirrors `lib/works/a-new-hope.ts`: WorkScript (title/format/logline/**text**) + Character[] (established/voiceNote/openers/facets/defer).
- A1 hamlet · A2 a-dolls-house · A3 earnest · A4 cyrano · A5 pygmalion · A6 caligari · A7 nosferatu
- (last-shift already exists as SCRIPT/CHARACTERS → repackaged in S2)

## Wave B — SCREENS (parallel, file-disjoint components)
- B1 entry-view (new) · B2 consent-view (new) · B3 library-view (new) · B4 detail-view (new)
- B5 chat-view (restyle) · B6 call-view + call-transcript (restyle) · B7 video-view (restyle) · B8 dossier-sheet (restyle)

## Status
See `units.json`.

## Execution note
Cross-repo from commander (Arqo). Parallel agents author **disjoint files only** in the shared
`green-room-brutalist` checkout — NO git/build in agents; commander commits + runs the integrated
`next build` gate per wave. No merge daemon (single foreign repo, local integration, one PR at end).
