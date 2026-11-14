// Notes de la semaine : les épisodes d'anime diffusés ces 7 derniers jours (AniList),
// notés par les spectateurs sur TMDB (dernier épisode diffusé de chaque série :
// note, nombre de votes, image de l'épisode). IMDb n'a pas d'API publique gratuite.
// Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "./member-extras";
import { tmdbGet } from "./works/tmdb";

export interface EpisodeRating {
  tmdbId: number;
  title: string;          // titre français TMDB, sinon rōmaji AniList
  season: string | null;  // « Saison 3 » si la série AniList l'indique
  episode: number;        // numéro AniList (celui que les fans connaissent)
  score: number;          // sur 10
  votes: number;
  still: string | null;   // image de l'épisode (TMDB), sinon bannière AniList
  airedAt: string;        // date de diffusion (TMDB)
  url: string;
}

const MIN_VOTES = 2;
const QUERY = `query($a:Int,$b:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){episode
media{id title{romaji english native} bannerImage popularity isAdult format}}}}`;

interface Raw { episode: number; media: { id: number; title: { romaji?: string; english?: string; native?: string }; bannerImage?: string | null; popularity?: number; isAdult?: boolean; format?: string } }

const compact = (s?: string) => (s ?? "").replace(/[\s　・:：!！?？~〜「」『』()（）]/g, "");

/** « Saison 3 » d'après le titre AniList (« Season 3 », « 3rd Season », « Part 2 »…). */
export function seasonLabel(...titles: (string | undefined)[]): string | null {
  for (const t of titles) {
    const m = t?.match(/season\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season/i);
    if (m) return `Saison ${m[1] ?? m[2]}`;
  }
  return null;
}

async function airedLastWeek(): Promise<Raw[]> {
  const now = Math.floor(Date.now() / 1000);
  const out: Raw[] = [];
  for (let page = 1; page <= 4; page++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { a: now - 7 * 86400, b: now, p: page } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const data = (await res.json())?.data?.Page;
    out.push(...(data?.airingSchedules ?? []));
    if (!data?.pageInfo?.hasNextPage) break;
  }
  return out;
}

interface TmdbShow { id: number; name?: string; original_name?: string; genre_ids?: number[]; origin_country?: string[] }
interface TmdbDetail { name?: string; last_episode_to_air?: { vote_average?: number; vote_count?: number; still_path?: string | null; air_date?: string; season_number?: number; episode_number?: number } | null }

/** Série TMDB correspondante : titre japonais d'origine identique (fiable, jamais affiché). */
async function matchTmdb(r: Raw): Promise<TmdbShow | null> {
  const native = compact(r.media.title.native);
  for (const q of [r.media.title.english, r.media.title.romaji].filter(Boolean) as string[]) {
    const found = await tmdbGet<{ results?: TmdbShow[] }>(`/search/tv?query=${encodeURIComponent(q.replace(/\s*(season\s*\d+|\d+(st|nd|rd|th)\s*season|part\s*\d+)\s*$/i, ""))}&include_adult=false`);
    const hit = (found.results ?? []).find((x) => {
      if (!x.genre_ids?.includes(16)) return false;
      const o = compact(x.original_name);
      return !!native && !!o && (native.startsWith(o) || o.startsWith(native));
    });
    if (hit) return hit;
  }
  return null;
}

export const getWeeklyRatings = unstable_cache(async (): Promise<EpisodeRating[]> => {
  const raw = (await airedLastWeek()).filter((r) => !r.media.isAdult && ["TV", "TV_SHORT", "ONA"].includes(r.media.format ?? ""));
  // Le dernier épisode de chaque série, parmi les 40 plus populaires.
  const latest = new Map<number, Raw>();
  for (const r of raw) if (!latest.has(r.media.id) || latest.get(r.media.id)!.episode < r.episode) latest.set(r.media.id, r);
  const candidates = [...latest.values()].sort((a, b) => (b.media.popularity ?? 0) - (a.media.popularity ?? 0)).slice(0, 40);

  const weekAgo = Date.now() - 8 * 86400_000;
  const out: EpisodeRating[] = [];
  for (let i = 0; i < candidates.length; i += 6) {
    await Promise.all(candidates.slice(i, i + 6).map(async (r) => {
      const show = await matchTmdb(r).catch(() => null);
      if (!show) return;
      const d = await tmdbGet<TmdbDetail>(`/tv/${show.id}`).catch(() => null);
      const ep = d?.last_episode_to_air;
      if (!ep?.air_date || !ep.vote_average || (ep.vote_count ?? 0) < MIN_VOTES) return;
      if (new Date(ep.air_date).getTime() < weekAgo) return;
      const romaji = r.media.title.romaji && !hasJapanese(r.media.title.romaji) ? r.media.title.romaji : null;
      const title = (d?.name && !hasJapanese(d.name) ? d.name : null) ?? romaji ?? r.media.title.english ?? "";
      if (!title) return;
      out.push({
        tmdbId: show.id, title,
        season: seasonLabel(r.media.title.english, r.media.title.romaji),
        episode: r.episode,
        score: Math.round(ep.vote_average * 10) / 10,
        votes: ep.vote_count ?? 0,
        still: ep.still_path ? `https://image.tmdb.org/t/p/w780${ep.still_path}` : r.media.bannerImage ?? null,
        airedAt: ep.air_date,
        url: `https://www.themoviedb.org/tv/${show.id}/season/${ep.season_number}/episode/${ep.episode_number}`,
      });
    }));
  }
  return out.sort((a, b) => b.score - a.score || b.votes - a.votes).slice(0, 8);
}, ["weekly-ratings-v1"], { revalidate: 60 * 60 * 6 });
