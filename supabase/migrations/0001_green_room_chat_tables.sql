-- Green Room (Arqo companion app) private tables. Prefixed gr_ to coexist with
-- Arqo's schema in the shared project. Green Room only READS public.* (the
-- writer's own scripts/characters via existing RLS); it WRITES only here.
-- All rows are owner-scoped to auth.uid(). No FK into public.* — Green Room
-- merely references an Arqo script_id/character by value, never couples to it.

create table if not exists public.gr_chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  script_id    uuid,                       -- Arqo script being discussed (by value)
  character_ref text,                      -- Arqo character id (by value), nullable
  character_name text not null,
  mode         text not null default 'chat' check (mode in ('chat','call','video')),
  title        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.gr_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.gr_chat_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists gr_chat_sessions_user_idx   on public.gr_chat_sessions(user_id, updated_at desc);
create index if not exists gr_chat_messages_session_idx on public.gr_chat_messages(session_id, created_at);

alter table public.gr_chat_sessions enable row level security;
alter table public.gr_chat_messages enable row level security;

-- Sessions: full CRUD, but only your own.
create policy gr_chat_sessions_select on public.gr_chat_sessions
  for select using (user_id = auth.uid());
create policy gr_chat_sessions_insert on public.gr_chat_sessions
  for insert with check (user_id = auth.uid());
create policy gr_chat_sessions_update on public.gr_chat_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy gr_chat_sessions_delete on public.gr_chat_sessions
  for delete using (user_id = auth.uid());

-- Messages: full CRUD, only your own, and only within a session you own.
create policy gr_chat_messages_select on public.gr_chat_messages
  for select using (user_id = auth.uid());
create policy gr_chat_messages_insert on public.gr_chat_messages
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.gr_chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
create policy gr_chat_messages_delete on public.gr_chat_messages
  for delete using (user_id = auth.uid());

-- Keep gr_chat_sessions.updated_at fresh.
create or replace function public.gr_touch_session_updated_at()
returns trigger language plpgsql as $_$
begin
  new.updated_at = now();
  return new;
end;
$_$;

create trigger gr_chat_sessions_touch
  before update on public.gr_chat_sessions
  for each row execute function public.gr_touch_session_updated_at();
