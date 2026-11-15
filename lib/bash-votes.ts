// Sondage du Bash : « Je regarde » / « Je passe » sur chaque chronique.
// Table `bash_votes` (scripts/migrations/2026-11-15_bash_votes.sql), lue et écrite
// uniquement par le serveur (clé service_role). Module serveur.
import { getServiceClient } from "./supabase-admin";
import { DOSSIER_BASH_DATA, normalizeDossierBashKey } from "./dossier-bash";

export type BashChoice = "watch" | "skip";
export interface PollResult { watch: number; skip: number; watchers: number[]; skippers: number[] }

/** Identifiant d'une chronique dans le sondage (même règle que les liens de la Bibliothèque). */
export const chroniqueSlug = (title: string) => normalizeDossierBashKey(title).replace(/\s+/g, "-");
const KNOWN = new Set(DOSSIER_BASH_DATA.map((e) => chroniqueSlug(e.title)));
export const isKnownChronique = (slug: string) => KNOWN.has(slug);

export const VOTER = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Table absente (migration pas encore lancée) : le sondage reste masqué. */
const missingTable = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || /bash_votes/.test(e.message ?? "") && /exist|schema cache/i.test(e.message ?? ""));

export async function readPolls(): Promise<{ available: boolean; polls: Record<string, PollResult> }> {
  const db = getServiceClient();
  if (!db) return { available: false, polls: {} };
  const { data, error } = await db.from("bash_votes").select("chronique, choice, member_id").limit(20000);
  if (error) {
    if (missingTable(error)) return { available: false, polls: {} };
    throw new Error(error.message);
  }
  const polls: Record<string, PollResult> = {};
  for (const v of data ?? []) {
    const p = (polls[v.chronique] ??= { watch: 0, skip: 0, watchers: [], skippers: [] });
    if (v.choice === "watch") { p.watch++; if (v.member_id) p.watchers.push(Number(v.member_id)); }
    else if (v.choice === "skip") { p.skip++; if (v.member_id) p.skippers.push(Number(v.member_id)); }
  }
  return { available: true, polls };
}

/** Enregistre, change ou retire (choice = null) le vote d'un appareil. */
export async function castVote(chronique: string, voter: string, choice: BashChoice | null, memberId: number | null): Promise<void> {
  const db = getServiceClient();
  if (!db) throw new Error("Base non configurée");
  if (choice === null) {
    const { error } = await db.from("bash_votes").delete().eq("chronique", chronique).eq("voter", voter);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("bash_votes").upsert(
    { chronique, voter, choice, member_id: memberId, updated_at: new Date().toISOString() },
    { onConflict: "chronique,voter" },
  );
  if (error) throw new Error(error.message);
}
