# LFG — Green Room: Auth + Supabase (read real Arqo data)

**Repo:** ahujatries/green-room · **Supabase:** red-ball `hathlibvyfjmwtxxhmev` (shared with Arqo)
**Decision:** reuse red-ball (shared auth.users w/ Arqo); read user's own `public.*` via RLS; write only `gr_*`.
**Auth:** magic link + Google + GitHub. **Scope:** auth + persistence.

## Architecture
- READ (Arqo tables, RLS owner-only): scripts → characters → scenes/script_elements (exclude is_vault).
- WRITE (Green Room only): gr_chat_sessions, gr_chat_messages.
- Single sign-on: an Arqo user logs in and sees their own scripts/characters in Green Room.

## SPINE — DONE (commit 2fbb640, on main)
- lib/supabase/{client,server,middleware,types}.ts · package.json deps · .env.example · .env.local (real keys)
- migration 0001_green_room_chat_tables.sql applied to red-ball (gr_* tables + RLS).

## WAVE 1 — auth primitives + data layer (all NEW files, file-disjoint)
- W1-A  middleware.ts (root) — session refresh + route protection.
- W1-B  app/login/page.tsx + components/login-form.tsx — magic link + Google + GitHub.
- W1-C  app/auth/callback/route.ts + app/auth/auth-code-error/page.tsx — code exchange.
- W1-D  lib/data/{scripts,characters,grounding}.ts — read real Arqo scripts/characters.
- W1-E  app/actions/auth.ts + components/user-menu.tsx — sign out + user menu.

## WAVE 2 — integration (hot files, single-owner, depends on W1)
- W2-A  app/page.tsx + app/layout.tsx (+ home-view) — auth gate, script picker, real characters, user menu.
- W2-B  app/api/chat/route.ts + lib/data/chat.ts — ground in real character/script + persist messages.

## WAVE 3 — voice grounding (depends on W2)
- W3-A  app/api/{voice-reply,transcribe,speech}/route.ts + lib/use-voice-call.ts — real-character voice.

## Status
- spine: merged
- wave1: in-flight
