// Votes de films : lecture et écriture (tables film_polls et film_poll_votes,
// scripts/migrations/2026-11-20_film_polls.sql) et fiches TMDB des films. Module serveur.
import { getServiceClient } from "./supabase-admin";
import { tmdbGet } from "./works/tmdb";
import { hasJapanese } from "./member-extras";
import { isOpen, tally, type FilmPoll, type PollFilm, type PollTally } from "./film-poll-logic";

const missingTable = (e: { code?: string; message?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205" || (/film_poll/.test(e.message ?? "") && /exist|schema cache/i.test(e.message ?? "")));
export const POLLS_MISSING = "Votes de films pas encore activés : lance la migration 2026-11-20_film_polls.sql dans Supabase.";

/** Fiche d'un film pour le vote : titre français, affiche, synopsis, durée, réalisateur, bande-annonce. */
export async function filmCard(tmdb: number): Promise<PollFilm> {
  type Detail = { id: number; title?: string; original_title?: string; release_date?: string; poster_path?: string | null; backdrop_path?: string | null; overview?: string; runtime?: number | null; vote_average?: number; genres?: { name: string }[]; credits?: { crew?: { job?: string; name?: string }[] }; videos?: { results?: { type?: string; site?: string; key?: string; iso_639_1?: string }[] } };
  const d = await tmdbGet<Detail>(`/movie/${tmdb}?append_to_response=videos,credits&include_video_language=fr,en,null`);
  const vids = (d.videos?.results ?? []).filter((v) => v.site === "YouTube" && v.key);
  const trailer = vids.find((v) => v.type === "Trailer" && v.iso_639_1 === "fr") ?? vids.find((v) => v.type === "Trailer") ?? vids[0];
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
  const title = d.title && !hasJapanese(d.title) ? d.title : d.original_title && !hasJapanese(d.original_title) ? d.original_title : `Film n°${d.id}`;
  return {
    tmdb: d.id, title, year: d.release_date ? Number(d.release_date.slice(0, 4)) || null : null,
    poster: d.poster_path ?? null, backdrop: d.backdrop_path ?? null,
    overview: d.overview?.trim() || null, runtime: d.runtime || null,
    // Pas d'écriture japonaise à l'écran : un nom en kanji est omis.
    director: director && !hasJapanese(director) ? director : null,
    genres: d.genres?.map((g) => g.name).join(", ") || null,
    note: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null, trailer: trailer?.key ?? null,
  };
}

/** Recherche de films sur TMDB (titre français si possible). */
export async function searchFilms(q: string) {
  type Hit = { id: number; title?: string; original_title?: string; release_date?: string; poster_path?: string | null; overview?: string; popularity?: number };
  const r = await tmdbGet<{ results?: Hit[] }>(`/search/movie?query=${encodeURIComponent(q)}&include_adult=false`);
  // Les films connus d'abord : « Your Name » trouve le film de 2016, pas un court-métrage homonyme.
  return [...(r.results ?? [])].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 12).map((h) => ({
    tmdb: h.id, title: h.title && !hasJapanese(h.title) ? h.title : h.original_title ?? "", original: h.original_title && !hasJapanese(h.original_title) ? h.original_title : null,
    year: h.release_date ? Number(h.release_date.slice(0, 4)) || null : null, poster: h.poster_path ?? null, overview: h.overview?.slice(0, 220) ?? null,
  })).filter((h) => h.title);
}

export async function listPolls(limit = 30): Promise<{ available: boolean; polls: FilmPoll[] }> {
  const db = getServiceClient();
  if (!db) return { available: false, polls: [] };
  const { data, error } = await db.from("film_polls").select("*").order("ends_at", { ascending: false }).limit(limit);
  if (error) { if (missingTable(error)) return { available: false, polls: [] }; throw new Error(error.message); }
  return { available: true, polls: (data ?? []) as FilmPoll[] };
}

export async function pollBySlug(slug: string): Promise<FilmPoll | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("film_polls").select("*").eq("slug", slug).limit(1);
  if (error) { if (missingTable(error)) return null; throw new Error(error.message); }
  return ((data ?? [])[0] as FilmPoll) ?? null;
}

/** Sondage à montrer sur l'accueil : celui en cours, sinon le dernier terminé depuis moins de 3 jours. */
export async function currentPoll(now = Date.now()): Promise<FilmPoll | null> {
  const { polls } = await listPolls(10);
  return polls.find((p) => isOpen(p, now)) ?? polls.find((p) => Date.parse(p.ends_at) <= now && now - Date.parse(p.ends_at) < 3 * 86_400_000) ?? null;
}

export async function results(poll: FilmPoll, voter?: string | null): Promise<{ tally: PollTally; mine: number | null }> {
  const db = getServiceClient();
  if (!db) return { tally: tally(poll.films, []), mine: null };
  const { data, error } = await db.from("film_poll_votes").select("choice, voter").eq("poll_id", poll.id).limit(20000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { choice: number; voter: string }[];
  return { tally: tally(poll.films, rows.map((r) => ({ choice: Number(r.choice) }))), mine: voter ? Number(rows.find((r) => r.voter === voter)?.choice) || null : null };
}

/** Vote, changement de vote, ou retrait (choice = null). */
export async function castFilmVote(poll: FilmPoll, voter: string, choice: number | null, memberId: number | null): Promise<void> {
  const db = getServiceClient();
  if (!db) throw new Error("Base non configurée");
  if (choice === null) {
    const { error } = await db.from("film_poll_votes").delete().eq("poll_id", poll.id).eq("voter", voter);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("film_poll_votes").upsert(
    { poll_id: poll.id, voter, choice, member_id: memberId, updated_at: new Date().toISOString() },
    { onConflict: "poll_id,voter" },
  );
  if (error) throw new Error(error.message);
}
