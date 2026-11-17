// Parties enregistrées (table game_plays) : lecture, écriture, statistiques.
// Si la table n'existe pas encore (migration non lancée), tout renvoie « indisponible »
// et les jeux restent jouables, avec l'historique gardé sur l'appareil. Module serveur.
import { createHash } from "node:crypto";
import { getServiceClient } from "../supabase-admin";
import { NO_STATS, type MemberStats } from "./badges";

export const GAMES = ["quiz-generique", "quiz-nostalgie", "affiche", "plus-moins", "defi-jour", "devine-anime", "devine-perso", "emoji-quiz", "duel"] as const;
/** Jeux à une partie par jour : classés au total de points. */
export const DAILY_GAMES: readonly Game[] = ["defi-jour", "devine-anime", "devine-perso"];
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

/* ── Classement complet d'un jeu : tous les joueurs, leurs parties ─────── */
export interface PlaySummary { score: number; max: number; at: string; good?: number; rounds?: number; date?: string; ok?: boolean; a?: number; b?: number; tries?: number }
export interface PlayerRank { key: string; member_id: number | null; name: string | null; plays: number; best: number; bestMax: number; avg: number; total: number; wins: number; last: string; history: PlaySummary[] }

/**
 * Identifiant public d'un joueur : le membre s'il a dit qui il est, sinon une empreinte
 * de l'appareil (l'identifiant d'appareil lui-même n'est jamais renvoyé au navigateur).
 */
export const playerKey = (p: { member_id: number | null; device: string }) =>
  p.member_id ? `m${p.member_id}` : `g${createHash("sha256").update(`guilde-joueur:${p.device}`).digest("hex").slice(0, 12)}`;

/** Garde de chaque partie ce qui sert à l'affichage (pas les extraits ni les corrigés). */
function summary(p: Play): PlaySummary {
  const d = p.detail ?? {};
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  return { score: p.score, max: p.max_score, at: p.created_at, good: num(d.good), rounds: num(d.rounds), date: typeof d.date === "string" ? d.date : undefined, ok: typeof d.ok === "boolean" ? d.ok : undefined, a: num(d.a), b: num(d.b), tries: num(d.tries) };
}

/** Rang par meilleur score (défi du jour : par total de points), puis par nombre de parties. */
export function rankPlayers(game: Game, rows: Play[]): PlayerRank[] {
  const by = new Map<string, PlayerRank>();
  for (const p of [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const key = playerKey(p);
    const r = by.get(key) ?? { key, member_id: p.member_id, name: null, plays: 0, best: -1, bestMax: 0, avg: 0, total: 0, wins: 0, last: p.created_at, history: [] };
    r.plays++; r.total += p.score;
    if (p.score > 0) r.wins++;
    if (p.score > r.best) { r.best = p.score; r.bestMax = p.max_score; }
    r.name ??= p.player_name;
    if (r.history.length < 30) r.history.push(summary(p));
    by.set(key, r);
  }
  const list = [...by.values()].map((r) => ({ ...r, avg: Math.round(r.total / r.plays) }));
  const main = (r: PlayerRank) => (DAILY_GAMES.includes(game) ? r.total : r.best);
  return list.sort((a, b) => main(b) - main(a) || b.plays - a.plays || a.last.localeCompare(b.last));
}

export async function ranking(game: Game): Promise<{ available: boolean; players: PlayerRank[]; feed: (PlaySummary & { key: string })[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, players: [], feed: [] };
  const { data, error } = await db.from("game_plays").select("*").eq("game", game).order("created_at", { ascending: false }).limit(3000);
  if (error) return { available: false, players: [], feed: [] };
  const rows = (data ?? []) as Play[];
  return { available: true, players: rankPlayers(game, rows), feed: rows.slice(0, 15).map((p) => ({ ...summary(p), key: playerKey(p) })) };
}

/** La partie du jour d'un joueur pour un jeu quotidien (appareil, ou membre s'il s'est identifié). */
export async function todayPlay(game: Game, date: string, device: string, memberId: number | null): Promise<Play | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("game_plays").select("*").eq("game", game).order("created_at", { ascending: false }).limit(1000);
  if (error) return null;
  return ((data ?? []) as Play[]).find((p) => p.detail?.date === date && (p.device === device || (!!memberId && p.member_id === memberId))) ?? null;
}

/* ── Énigmes en émojis proposées par les membres (table emoji_puzzles) ── */
export interface EmojiRow { id: number; emojis: string; answer: string; hint: string | null; status: "pending" | "approved"; member_id: number | null; player_name: string | null; created_at: string }

export async function emojiRows(status?: EmojiRow["status"]): Promise<{ available: boolean; rows: EmojiRow[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, rows: [] };
  let q = db.from("emoji_puzzles").select("*").order("created_at", { ascending: false }).limit(1000);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  return error ? { available: false, rows: [] } : { available: true, rows: (data ?? []) as EmojiRow[] };
}

export async function addEmoji(row: Omit<EmojiRow, "id" | "created_at">): Promise<string | null> {
  const db = getServiceClient();
  if (!db) return "Base non configurée.";
  const { error } = await db.from("emoji_puzzles").insert(row);
  return error ? (/emoji_puzzles|relation|schema cache/i.test(error.message) ? "Les propositions arrivent bientôt (migration à lancer)." : "Énigme non enregistrée.") : null;
}
