// Parties enregistrées (table game_plays) : lecture, écriture, statistiques.
// Si la table n'existe pas encore (migration non lancée), tout renvoie « indisponible »
// et les jeux restent jouables, avec l'historique gardé sur l'appareil. Module serveur.
import { getServiceClient } from "../supabase-admin";
import { NO_STATS, type MemberStats } from "./badges";

export const GAMES = ["quiz-generique", "quiz-nostalgie", "affiche", "plus-moins", "defi-jour", "duel"] as const;
export type Game = (typeof GAMES)[number];
export const isGame = (g: unknown): g is Game => GAMES.includes(g as Game);
export interface Play { id: number; game: Game; device: string; member_id: number | null; player_name: string | null; score: number; max_score: number; detail: Record<string, unknown>; created_at: string }

export async function recordPlay(p: Omit<Play, "id" | "created_at"> & { nonce?: string }): Promise<boolean> {
  return (await recordPlayId(p)) !== null;
}

/** Enregistre une partie et renvoie son numéro (null : base indisponible ou jeu pas encore autorisé). */
export async function recordPlayId(p: Omit<Play, "id" | "created_at"> & { nonce?: string }): Promise<number | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("game_plays").insert(p).select("id");
  if (error && /duplicate key/i.test(error.message)) throw new Error("Partie déjà enregistrée.");
  return error ? null : Number((data ?? [])[0]?.id) || null;
}

/** Meilleur score par joueur (membre, sinon appareil) et dernières parties. */
export async function leaderboard(game: Game, limit = 20, day?: string): Promise<{ available: boolean; best: Play[]; recent: Play[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, best: [], recent: [] };
  const { data, error } = await db.from("game_plays").select("*").eq("game", game).order("score", { ascending: false }).limit(500);
  if (error) return { available: false, best: [], recent: [] };
  // Défi du jour : seulement les parties de la date demandée.
  const rows = ((data ?? []) as Play[]).filter((r) => !day || r.detail?.date === day).sort((a, b) => b.score - a.score);
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
    if (r.game === "quiz-nostalgie") s.nostalgiePlays++;
    if (r.game === "affiche" && r.max_score) s.afficheBestPct = Math.max(s.afficheBestPct, Math.round((100 * r.score) / r.max_score));
    if (r.game === "plus-moins") s.pmBest = Math.max(s.pmBest, r.score);
    if (r.game === "defi-jour" && r.score > 0) s.dailyWins++;
  }
  const votes = await db.from("bash_votes").select("member_id").not("member_id", "is", null).limit(5000);
  for (const r of (votes.data ?? []) as { member_id: number }[]) get(r.member_id).bashVotes++;
  return out;
}

/** Une partie par son numéro (défi entre amis). */
export async function getPlay(id: number): Promise<Play | null> {
  const db = getServiceClient();
  if (!db || !Number.isInteger(id) || id <= 0) return null;
  const { data, error } = await db.from("game_plays").select("*").eq("id", id).limit(1);
  return error ? null : ((data ?? [])[0] as Play | undefined) ?? null;
}

/** Vrai si une partie porte déjà ce nonce (partie terminée, défi du jour déjà joué). */
export async function nonceUsed(nonce: string): Promise<boolean> {
  const db = getServiceClient();
  if (!db) return false;
  const { data, error } = await db.from("game_plays").select("id, score, detail").eq("nonce", nonce).limit(1);
  return !error && (data ?? []).length > 0;
}

/** Parties du défi du jour d'un joueur (appareil, ou membre s'il a dit qui il est). */
export async function dailyHistory(device: string, memberId: number | null): Promise<Play[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db.from("game_plays").select("*").eq("game", "defi-jour").order("created_at", { ascending: false }).limit(2000);
  if (error) return [];
  return ((data ?? []) as Play[]).filter((p) => p.device === device || (memberId && p.member_id === memberId));
}

/* ── Tier list (table tier_lists) ─────────────────────────────────────── */
export interface TierListRow { week: string; device: string; member_id: number | null; player_name: string | null; ranks: unknown; updated_at?: string }

export async function tierRows(week: string): Promise<{ available: boolean; rows: TierListRow[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, rows: [] };
  const { data, error } = await db.from("tier_lists").select("*").eq("week", week).limit(500);
  return error ? { available: false, rows: [] } : { available: true, rows: (data ?? []) as TierListRow[] };
}

export async function saveTier(row: TierListRow): Promise<string | null> {
  const db = getServiceClient();
  if (!db) return "Base non configurée.";
  const { error } = await db.from("tier_lists").upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "week,device" });
  return error ? (/tier_lists|relation|schema cache/i.test(error.message) ? "La tier list commune arrive bientôt (migration à lancer)." : "Classement non enregistré.") : null;
}
