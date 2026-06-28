# Brutalist Call-Sheet — Design Contract (read this before touching any screen)

The whole look is **a call sheet pinned to a board**: a light olive *field* inside a
deep-forest page, **hard offset ink shadows** (no blur), **2px solid ink borders** on
everything, and a clap-stripe cap. Match the prototype section for your screen
**pixel-for-pixel in spirit**, but express it with the tokens + utilities below — never
hardcode hexes that already have a token.

## Palette → Tailwind tokens (defined in `app/globals.css @theme`)
| token class | hex | use |
|---|---|---|
| `forest` | `#16280f` | page behind the phone · dark cards/wells |
| `forestdeep` | `#0b1607` | deepest green — outer shadow, image wells |
| `field` | `#d7e8ae` | the phone body / app field (light olive) |
| `brink` | `#1a2418` | **ink** — every border + primary text on light |
| `bonepaper` | `#fbf8ee` | card paper on the field |
| `header` | `#3f7a1c` | back-header green |
| `headerdeep` | `#275b08` | brand-header green |
| `spring` | `#a5e857` | primary accent / CTA fills / live dots |
| `springdim` | `#a7be86` | muted spring label on dark |
| `springpale` | `#c8ee9a` | pale spring label |
| `canopytext` | `#3f7a1c` | mono eyebrow labels on light |
| `quill` | `#5a6450` | muted mono meta on light |
| `quill2` | `#8fa383` | muted text on dark wells |
| `callbone` | `#f7f2e6` | warm bone text on call/video dark |
| `callfog` | `#efe9db` | secondary bone on dark |
| `flamecall` | `#b95236` | end-call red |

Use as `bg-field`, `border-brink`, `text-canopytext`, etc. Opacity via `text-brink/80`.

## Utilities (already in globals.css — DO NOT redefine)
- `.clap` — the clap-stripe gradient (already on the shell; screens don't need it)
- `.hard-sm` (3px), `.hard` (4px), `.hard-lg` (6px) — hard ink offset shadows
- `.hard-deep` — 4px shadow in `forestdeep` (for cards on dark)
- `.lift` — hover press-lift (translate -2,-2 + deepen shadow). Put on clickable cards.
- `.pop` — entrance animation for arriving rows/messages
- `.rise` — screen/scroll-region entrance (already used by stubs)
- `.gr-scroll` — hidden scrollbars; `.wavebar` / `.dot` — voice waveform / typing dots

## Typography (3 families, already wired in layout.tsx)
- `font-sans` = Geist — wordmark (`font-black`), UI
- `font-mono` = Geist Mono — **all eyebrows / labels / meta / badges**, uppercase, tracked
  (`tracking-[0.12em]`–`tracking-[0.2em]`), tiny (7–9px)
- `font-script` = Courier Prime — **character names, dialogue/"from the page" lines, titles**

## Recipes (the grammar — reuse exactly)
- **Card:** `border-2 border-brink bg-bonepaper hard` (+ `.lift` if clickable).
- **Image/cover well:** `bg-forest` block, `border-b-2 border-brink`, initial in `font-script text-field`.
  (We render initials/gradient wells, NOT `<image-slot>` — there is no casting-photo route.)
- **Primary button:** `border-2 border-brink bg-spring text-brink hard-sm` + mono uppercase label.
- **Eyebrow label:** `font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext`.
- **Dark panel (chat empty-state, call/video):** `bg-forest`/`bg-forestdeep`, text `callbone`/`field`,
  accents `spring`. The "from the page" quote block: `border-l-2 border-spring` + Courier Prime.

## Hard rules
1. **Only edit the file(s) assigned to your unit.** No git, no `npm`/build — the commander
   integrates and runs the build gate.
2. Keep the **exact exported component name + props** (the shell in `green-room.tsx` already
   imports them). Don't change a signature.
3. Inline SVG icons (match the prototype's stroke icons). Do **not** add to `icons.tsx`.
4. `<img>` for the spiral only (`/arqo-spiral.svg`); add the eslint-disable line like the shell.
5. Preserve all existing behavior/data flow (streaming chat, `useVoiceCall`, dossier open, etc.)
   — this is a **reskin**, not a rewrite of logic.
6. Reference: `PROTOTYPE.html` in this folder (your screen's `<!-- ===== X ===== -->` section)
   and `lib/works/a-new-hope.ts` for the data shape.
