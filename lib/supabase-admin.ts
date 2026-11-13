// Client Supabase avec la clé serveur (service_role). Réservé aux routes API
// protégées par la session admin : ne jamais l'importer dans un composant client.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/** Client serveur, ou null si NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquent. */
export function getServiceClient(): SupabaseClient | null {
  if (typeof window !== "undefined") throw new Error("getServiceClient est réservé au serveur");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached ??= createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export const SERVICE_KEY_MISSING = "Base non configurée sur le serveur (SUPABASE_SERVICE_ROLE_KEY)";
