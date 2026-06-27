// The Green Room home — a SERVER component now. It resolves the signed-in
// writer, lists their OWN Arqo scripts (RLS-scoped), and loads the first
// script's cast for a fast first paint. Then it hands everything to the client
// <AppShell/>, which owns view-switching, the script picker, and on-demand
// loads of other scripts' casts via server actions.
//
// No fake data, ever: a writer with zero scripts gets a tasteful empty state
// that points them back to Arqo, not a hard-coded demo screenplay.

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listScripts } from "@/lib/data/scripts";
import { loadCharacters } from "@/lib/data/characters";
import { AppShell } from "@/components/app-shell";
import { UserMenu } from "@/components/user-menu";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware.ts already gates this route, but resolve defensively so the rest
  // of the page can assume a real user.
  if (!user) redirect("/login");

  const scripts = await listScripts();

  if (scripts.length === 0) {
    return <EmptyState email={user.email ?? null} />;
  }

  // First script's cast, server-rendered for an instant home. Every other
  // script loads its cast lazily from the picker (app/actions/data.ts).
  const initialScriptId = scripts[0].id;
  const initialCharacters = await loadCharacters(initialScriptId);

  return (
    <AppShell
      user={{ id: user.id, email: user.email ?? null }}
      scripts={scripts}
      initialScriptId={initialScriptId}
      initialCharacters={initialCharacters}
    />
  );
}

// In-aesthetic empty state for a writer who has no scripts in Arqo yet.
function EmptyState({ email }: { email: string | null }) {
  return (
    <main className="min-h-dvh w-full bg-void">
      <div className="shell-bg grain relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden font-sans text-bonelit sm:my-4 sm:h-[860px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:border sm:border-bonelit/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* spiral watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/arqo-spiral.svg"
          alt=""
          className="pointer-events-none absolute -bottom-[90px] -right-[70px] z-0 w-[380px] opacity-[0.045]"
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* bulb strip */}
          <div className="flex h-[14px] flex-none items-center justify-between border-b border-black/40 bg-[rgba(6,13,8,0.5)] px-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {/* header */}
          <header className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 px-[18px] pb-[11px] pt-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arqo-spiral.svg"
              alt="Arqo"
              className="h-[22px] w-[22px] flex-none"
            />
            <span className="font-sans text-[18px] font-black tracking-tight text-bonelit">
              the green room
            </span>
            <div className="flex-1" />
            <UserMenu email={email} />
          </header>

          {/* body */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-7 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arqo-spiral.svg"
              alt=""
              className="mb-6 h-14 w-14 opacity-30"
            />
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
              The room is empty
            </p>
            <h1 className="mt-3 font-script text-[28px] font-bold leading-[1.1] text-bonelit">
              No one to meet yet.
            </h1>
            <p className="mt-4 text-[14px] leading-[1.65] text-fog">
              The Green Room reads the characters straight from your Arqo
              scripts — and you don&rsquo;t have any yet. Start a script in Arqo,
              write a few people into it, and they&rsquo;ll be waiting here.
            </p>
            <a
              href="https://tryarqo.com"
              className="mt-7 rounded-full border border-canopy bg-canopy px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#f3eee3] transition-colors hover:bg-[#346416]"
            >
              Open Arqo
            </a>
            <p className="mt-6 text-[11.5px] leading-[1.6] text-mist2">
              They only know what the page knows. Write the page first.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
