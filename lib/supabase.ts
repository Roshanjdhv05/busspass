import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function isValidKey(k: string): boolean {
  if (!k || typeof k !== "string") return false;
  const trimmed = k.trim();
  // Valid keys are either JWTs (start with eyJ) or new Supabase keys (sb_publishable_ / sb_secret_)
  return trimmed.length > 20 && !trimmed.includes("placeholder");
}

export const supabase =
  url && key && isValidKey(key) ? createClient(url, key) : null;

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

