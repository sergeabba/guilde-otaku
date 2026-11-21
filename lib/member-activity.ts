// Activité d'un membre dans la Guilde (fiche « profil vivant ») : ses records aux jeux,
// ses votes de films et ses votes du Bash. Données réelles uniquement : parties et votes
// enregistrés avec son nom (pas ceux faits en invité). Module serveur.
import { getServiceClient } from "./supabase-admin";
import { tally, type FilmPoll } from "./film-poll-logic";

export const GAME_LABELS: Record<string, string> = {
  "quiz-generique": "Quiz génériques", "quiz-nostalgie": "Blind test Nostalgie", generiques: "Blind test vidéo",
  affiche: "L'Affiche en morceaux", "plus-moins": "Plus ou moins", "defi-jour": "Défi du jour",
  "devine-anime": "Devine l'anime", "devine-perso": "Devine le perso", "emoji-quiz": "Quiz des émojis",
  themes: "Devine par les thèmes", createur: "Qui l'a créé ?", studio: "Le studio", voix: "La voix", duel: "Duel de goûts",
};
const LEVEL_LABEL: Record<string, string> = { facile: "Facile", normal: "Normal", expert: "Expert" };

export interface GameRecord { game: string; label: string; plays: number; best: number; bestMax: number; pct: number; level: string | null; last: string }
export interface FilmVote { poll: string; slug: string; film: string; poster: string | null; ended: boolean; won: boolean }
export interface MemberActivity { available: boolean; plays: number; records: GameRecord[]; films: FilmVote[]; bash: { watch: number; skip: number }; last: string | null }

export const EMPTY_ACTIVITY: MemberActivity = { available: false, plays: 0, records: [], films: [], bash: { watch: 0, skip: 0 }, last: null };

/** Meilleure partie par jeu : le meilleur pourcentage du maximum (comparable entre niveaux). */
/** Jeux sans plafond de points (série, compatibilité) : record brut, sans pourcentage. */
const OPEN_SCORE = new Set(["plus-moins", "duel"]);

export function gameRecords(rows: { game: string; score: number; max_score: number; created_at: string; detail?: Record<string, unknown> | null }[]): GameRecord[] {
  const by = new Map<string, GameRecord>();
  for (const r of rows) {
    if (!GAME_LABELS[r.game]) continue;
    const pct = OPEN_SCORE.has(r.game) ? -1 : r.max_score > 0 ? Math.round((100 * r.score) / r.max_score) : 0;
    const cur = by.get(r.game);
    const level = typeof r.detail?.level === "string" ? LEVEL_LABEL[r.detail.level as string] ?? null : null;
    if (!cur) { by.set(r.game, { game: r.game, label: GAME_LABELS[r.game], plays: 1, best: r.score, bestMax: r.max_score, pct, level, last: r.created_at }); continue; }
    cur.plays++;
    if (r.created_at > cur.last) cur.last = r.created_at;
    if (pct > cur.pct || (pct === cur.pct && r.score > cur.best)) Object.assign(cur, { best: r.score, bestMax: r.max_score, pct, level });
  }
  return [...by.values()].sort((a, b) => b.plays - a.plays || b.pct - a.pct);
}

export async function memberActivity(id: number, now = Date.now()): Promise<MemberActivity> {
  const db = getServiceClient();
  if (!db) return EMPTY_ACTIVITY;
  const [plays, bash, votes] = await Promise.all([
    db.from("game_plays").select("game, score, max_score, created_at, detail").eq("member_id", id).order("created_at", { ascending: false }).limit(2000),
    db.from("bash_votes").select("choice").eq("member_id", id).limit(2000),
    db.from("film_poll_votes").select("poll_id, choice").eq("member_id", id).limit(200),
  ]);
  const rows = (plays.data ?? []) as Parameters<typeof gameRecords>[0];
  const out: MemberActivity = { available: !plays.error, plays: rows.length, records: gameRecords(rows), films: [], bash: { watch: 0, skip: 0 }, last: rows[0]?.created_at ?? null };
  for (const v of (bash.data ?? []) as { choice: string }[]) { if (v.choice === "watch") out.bash.watch++; else if (v.choice === "skip") out.bash.skip++; }
  // Votes de films (table absente avant la migration : ignorés sans erreur).
  const fv = (votes.error ? [] : (votes.data ?? [])) as { poll_id: number; choice: number }[];
  if (fv.length) {
    const ids = [...new Set(fv.map((v) => v.poll_id))].slice(0, 20);
    const [polls, all] = await Promise.all([
      db.from("film_polls").select("*").in("id", ids),
      db.from("film_poll_votes").select("poll_id, choice").in("poll_id", ids).limit(20000),
    ]);
    const allVotes = (all.data ?? []) as { poll_id: number; choice: number }[];
    for (const p of ((polls.data ?? []) as FilmPoll[]).sort((a, b) => b.ends_at.localeCompare(a.ends_at))) {
      const mine = fv.find((v) => v.poll_id === p.id);
      const film = p.films.find((f) => f.tmdb === Number(mine?.choice));
      if (!film) continue;
      const ended = Date.parse(p.ends_at) <= now;
      const t = tally(p.films, allVotes.filter((v) => v.poll_id === p.id).map((v) => ({ choice: Number(v.choice) })));
      out.films.push({ poll: p.title, slug: p.slug, film: film.title, poster: film.poster, ended, won: ended && t.total > 0 && t.leaders.includes(film.tmdb) });
    }
  }
  return out;
}
