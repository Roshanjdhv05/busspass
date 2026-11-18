import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Real Supabase JWT keys always start with "eyJ".
 * The placeholder keys (sb_publishable_..., sb_secret_...) are NOT valid — reject them.
 */
function isValidKey(k: string): boolean {
  return k.startsWith("eyJ") && k.length > 100;
}

export const supabase =
  url && key && isValidKey(key) ? createClient(url, key) : null;

export function getSupabase() {
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
