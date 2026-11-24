// Teams de la Guilde : lecture et écriture de la table guild_teams
// (scripts/migrations/2026-11-24_guild_teams.sql). Module serveur.
import { getServiceClient } from "./supabase-admin";
import type { GuildTeam } from "./teams-logic";

export const TEAMS_MISSING = "Teams pas encore activées : lance la migration 2026-11-24_guild_teams.sql dans Supabase.";
export const missingTeamsTable = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "42P01" || e.code === "PGRST205" || (/guild_teams/.test(e.message ?? "") && /exist|schema cache/i.test(e.message ?? "")));

/** Toutes les équipes (admin) ou seulement celles publiées (site). */
export async function listTeams(publishedOnly: boolean): Promise<{ available: boolean; teams: GuildTeam[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, teams: [] };
  let q = db.from("guild_teams").select("*").order("position", { ascending: true }).order("id", { ascending: true }).limit(60);
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) { if (missingTeamsTable(error)) return { available: false, teams: [] }; throw new Error(error.message); }
  return { available: true, teams: (data ?? []) as GuildTeam[] };
}
