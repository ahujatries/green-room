// The Green Room home.
//
// Server entry: read the Supabase session (if any) and, for a signed-in writer,
// their own Arqo scripts — then hand both to the client root. A guest gets a
// null user and an empty list and sees the public catalog; a signed-in writer
// sees their real scripts and can talk to their own cast. All reads are
// RLS-scoped, so this can only ever surface the caller's own work.

import type { User } from "@supabase/supabase-js";

import { GreenRoom, type GrUser } from "@/components/green-room";
import { getUser } from "@/lib/supabase/user";
import { listScripts } from "@/lib/data/scripts";

// A writer's display name, best-effort from the OAuth/profile metadata, falling
// back to the email's local part and finally a neutral "Writer".
function displayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim());
  if (fromMeta) return fromMeta;
  const local = user.email?.split("@")[0]?.trim();
  return local || "Writer";
}

function initialOf(name: string): string {
  return (name.trim()[0] ?? "·").toUpperCase();
}

export default async function Page() {
  const user = await getUser();

  const initialScripts = user ? await listScripts() : [];

  const initialUser: GrUser = user
    ? {
        id: user.id,
        email: user.email ?? null,
        name: displayName(user),
        initial: initialOf(displayName(user)),
      }
    : null;

  return <GreenRoom initialUser={initialUser} initialScripts={initialScripts} />;
}
