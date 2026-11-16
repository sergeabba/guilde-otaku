// Parties enregistrées (table game_plays) : lecture, écriture, statistiques.
// Si la table n'existe pas encore (migration non lancée), tout renvoie « indisponible »
// et les jeux restent jouables, avec l'historique gardé sur l'appareil. Module serveur.
import { getServiceClient } from "../supabase-admin";
import { NO_STATS, type MemberStats } from "./badges";

export type Game = "quiz-generique" | "duel";
export interface Play { id: number; game: Game; device: string; member_id: number | null; player_name: string | null; score: number; max_score: number; detail: Record<string, unknown>; created_at: string }

export async function recordPlay(p: Omit<Play, "id" | "created_at"> & { nonce?: string }): Promise<boolean> {
  const db = getServiceClient();
  if (!db) return false;
  const { error } = await db.from("game_plays").insert(p);
  if (error && /duplicate key/i.test(error.message)) throw new Error("Partie déjà enregistrée.");
  return !error;
}

/** Meilleur score par joueur (membre, sinon appareil) et dernières parties. */
export async function leaderboard(game: Game, limit = 20): Promise<{ available: boolean; best: Play[]; recent: Play[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, best: [], recent: [] };
  const { data, error } = await db.from("game_plays").select("*").eq("game", game).order("score", { ascending: false }).limit(500);
  if (error) return { available: false, best: [], recent: [] };
  const rows = (data ?? []) as Play[];
  const seen = new Set<string>(), best: Play[] = [];
  for (const r of rows) { const who = r.member_id ? `m${r.member_id}` : `d${r.device}`; if (!seen.has(who)) { seen.add(who); best.push(r); } }
  const recent = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
  return { available: true, best: best.slice(0, limit), recent };
}

/** Historique d'un joueur : ses parties sur cet appareil et, s'il a dit qui il est, celles de son membre. */
export async function history(device: string, memberId: number | null): Promise<Play[]> {
  const db = getServiceClient();
  if (!db) return [];
  let q = db.from("game_plays").select("*").order("created_at", { ascending: false }).limit(40);
  q = memberId ? q.or(`device.eq.${device},member_id.eq.${memberId}`) : q.eq("device", device);
  const { data, error } = await q;
  return error ? [] : (data ?? []) as Play[];
}

/** Statistiques par membre pour les badges (parties + votes du Bash). */
export async function memberStats(): Promise<Map<number, MemberStats>> {
  const out = new Map<number, MemberStats>();
  const db = getServiceClient();
  if (!db) return out;
  const get = (id: number) => out.get(id) ?? (out.set(id, { ...NO_STATS }), out.get(id)!);
  const plays = await db.from("game_plays").select("member_id, game, score, max_score").not("member_id", "is", null).limit(5000);
  for (const r of (plays.data ?? []) as Pick<Play, "member_id" | "game" | "score" | "max_score">[]) {
    const s = get(r.member_id!);
    if (r.game === "quiz-generique") { s.quizPlays++; if (r.max_score) s.quizBestPct = Math.max(s.quizBestPct, Math.round((100 * r.score) / r.max_score)); }
    if (r.game === "duel") s.duels++;
  }
  const votes = await db.from("bash_votes").select("member_id").not("member_id", "is", null).limit(5000);
  for (const r of (votes.data ?? []) as { member_id: number }[]) get(r.member_id).bashVotes++;
  return out;
}
