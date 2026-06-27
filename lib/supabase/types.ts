// Focused Supabase types for Green Room. We deliberately do NOT vendor Arqo's
// full generated schema (100+ tables) — only the slices Green Room reads from
// public.* and the gr_* tables it owns. Keep this in sync with the migration in
// supabase/migrations/.

// ---- Arqo tables Green Room READS (via RLS; owner-only) -----------------------

export type ArqoScriptRow = {
  id: string;
  user_id: string;
  title: string | null;
  logline: string | null;
  synopsis: string | null;
  script_type: string | null;
  format: string | null;
  genres: string[] | null;
  tones: string[] | null;
  page_count: number | null;
  word_count: number | null;
  is_vault: boolean | null;
  updated_at: string;
};

export type ArqoCharacterRow = {
  id: string;
  script_id: string;
  name: string;
  description: string | null;
  bio: string | null;
  arc_notes: string | null;
  data: Record<string, unknown> | null;
  manual: boolean | null;
};

export type ArqoSceneRow = {
  id: string;
  script_id: string;
  scene_number: number | null;
  title: string | null;
  synopsis: string | null;
};

export type ArqoScriptElementRow = {
  id: string;
  scene_id: string;
  element_order: number;
  element_type: string;
  content: string | null;
};

// ---- Green Room tables it OWNS (gr_*) ---------------------------------------

export type GrChatMode = "chat" | "call" | "video";
export type GrChatRole = "user" | "assistant";

export type GrChatSessionRow = {
  id: string;
  user_id: string;
  script_id: string | null;
  character_ref: string | null;
  character_name: string;
  mode: GrChatMode;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type GrChatMessageRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: GrChatRole;
  content: string;
  created_at: string;
};
