// The Green Room home — a SERVER component. It resolves the signed-in writer
// and lists their OWN Arqo scripts (RLS-scoped). Writers WITH scripts get the
// real <AppShell/>. Everyone else — logged-out visitors, writers with no
// scripts yet, or anytime Supabase isn't reachable — gets the <DemoShell/>
// ("The Last Shift" sample) so the room is never empty and the app is always
// showable. The demo is the front door; real scripts upgrade it.

import { createClient } from "@/lib/supabase/server";
import { listScripts } from "@/lib/data/scripts";
import { loadCharacters } from "@/lib/data/characters";
import { AppShell } from "@/components/app-shell";
import { DemoShell } from "@/components/demo-shell";

export default async function Page() {
  // Resolve the user defensively — if Supabase isn't configured/reachable we
  // fall through to the demo instead of 500ing the whole site.
  let user: { id: string; email: string | null } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) user = { id: data.user.id, email: data.user.email ?? null };
  } catch {
    // Supabase unavailable → demo mode.
  }

  if (!user) return <DemoShell />;

  const scripts = await listScripts();
  // Signed in but no scripts in Arqo yet → still show the demo, not a wall.
  if (scripts.length === 0) return <DemoShell />;

  // First script's cast, server-rendered for an instant home. Every other
  // script loads its cast lazily from the picker (app/actions/data.ts).
  const initialScriptId = scripts[0].id;
  const initialCharacters = await loadCharacters(initialScriptId);

  return (
    <AppShell
      user={user}
      scripts={scripts}
      initialScriptId={initialScriptId}
      initialCharacters={initialCharacters}
    />
  );
}
