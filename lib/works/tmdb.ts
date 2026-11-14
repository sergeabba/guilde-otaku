// TMDB : séries anime et films d'animation, en français (language=fr-FR).
// Conditions TMDB : usage non commercial gratuit, mention « TMDB » obligatoire
// (logo dans une section Crédits / À propos, moins visible que celui du site).
// Clé côté serveur uniquement : TMDB_READ_TOKEN (jeton v4, en-tête Bearer) ou
// TMDB_API_KEY (clé v3, paramètre api_key).
import { hasJapanese } from "../member-extras";
import type { WorkCandidate, WorkFormat, WorkTrailer } from "./types";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const ANIMATION_GENRE = 16;

export class WorkSearchError extends Error {
  constructor(message: string, readonly status = 502) { super(message); }
}

function auth(): { headers: Record<string, string>; param: string } {
  const token = process.env.TMDB_READ_TOKEN?.trim();
  const key = process.env.TMDB_API_KEY?.trim();
  if (token) return { headers: { Authorization: `Bearer ${token}` }, param: "" };
  // Une clé v3 peut aussi être un jeton v4 collé dans TMDB_API_KEY : on le reconnaît.
  if (key?.startsWith("eyJ")) return { headers: { Authorization: `Bearer ${key}` }, param: "" };
  if (key) return { headers: {}, param: `&api_key=${encodeURIComponent(key)}` };
  throw new WorkSearchError("Clé TMDB absente : ajoute TMDB_API_KEY (ou TMDB_READ_TOKEN) dans les variables d'environnement Vercel.", 503);
}

export async function tmdbGet<T>(path: string): Promise<T> {
  const { headers, param } = auth();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${path}${sep}language=fr-FR${param}`, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) throw new WorkSearchError("TMDB refuse la clé : vérifie TMDB_API_KEY dans Vercel.", 503);
  if (res.status === 429) throw new WorkSearchError("TMDB limite les recherches : réessaie dans une minute.", 503);
  if (!res.ok) throw new WorkSearchError(`TMDB indisponible (${res.status}).`);
  return res.json() as Promise<T>;
}

interface TmdbItem {
  id: number; name?: string; title?: string; original_name?: string; original_title?: string;
  overview?: string; poster_path?: string | null; first_air_date?: string; release_date?: string;
  genre_ids?: number[]; original_language?: string; origin_country?: string[]; popularity?: number;
}

const year = (d?: string) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : undefined);
const clean = (s?: string | null) => (s ? s.replace(/\s+/g, " ").trim() : "");
export const tmdbPoster = (p?: string | null, size: "w342" | "w500" | "w780" = "w500") => (p ? `${IMG}/${size}${p}` : undefined);

function toCandidate(x: TmdbItem, type: "tv" | "movie"): WorkCandidate | null {
  const name = clean(type === "tv" ? x.name : x.title);
  const original = clean(type === "tv" ? x.original_name : x.original_title);
  // Titre affiché : jamais d'écriture japonaise. Sans titre latin, l'œuvre n'est pas proposée.
  const display = !hasJapanese(name) ? name : !hasJapanese(original) ? original : "";
  if (!display) return null;
  const overview = clean(x.overview);
  return {
    source: "tmdb",
    sourceId: `${type}:${x.id}`,
    kind: "ANIME",
    format: (type === "tv" ? "SERIE" : "FILM") as WorkFormat,
    title: display,
    // En fr-FR, TMDB renvoie le titre français s'il existe, sinon le titre original.
    titleFr: name && name !== original && !hasJapanese(name) ? name : overview ? display : undefined,
    titleEn: !hasJapanese(original) && original !== display ? original : undefined,
    year: year(type === "tv" ? x.first_air_date : x.release_date),
    // TMDB ne remplace pas un synopsis français manquant par l'anglais : vide = absent.
    synopsisFr: overview || undefined,
    coverUrl: tmdbPoster(x.poster_path),
    sourceUrl: `https://www.themoviedb.org/${type}/${x.id}`,
  };
}

/** Séries anime et films d'animation. Les œuvres japonaises passent devant. */
export async function searchTmdbAnime(query: string): Promise<WorkCandidate[]> {
  const q = encodeURIComponent(query);
  const [tv, movie] = await Promise.all([
    tmdbGet<{ results?: TmdbItem[] }>(`/search/tv?query=${q}&include_adult=false`),
    tmdbGet<{ results?: TmdbItem[] }>(`/search/movie?query=${q}&include_adult=false`),
  ]);
  const rank = (x: TmdbItem) => (x.original_language === "ja" ? 0 : 1);
  const pick = (list: TmdbItem[] | undefined, type: "tv" | "movie") =>
    (list ?? []).filter((x) => x.genre_ids?.includes(ANIMATION_GENRE)).map((x) => ({ x, type }));
  const all = [...pick(tv.results, "tv"), ...pick(movie.results, "movie")]
    .sort((a, b) => rank(a.x) - rank(b.x) || (b.x.popularity ?? 0) - (a.x.popularity ?? 0));
  return all.map(({ x, type }) => toCandidate(x, type)).filter((c): c is WorkCandidate => !!c).slice(0, 12);
}

interface TmdbDetail extends TmdbItem {
  genres?: { name: string }[];
  number_of_episodes?: number; number_of_seasons?: number; runtime?: number; status?: string;
  videos?: { results?: { key: string; site: string; type: string; iso_639_1?: string; name?: string; official?: boolean }[] };
  translations?: { translations?: { iso_639_1: string; iso_3166_1: string; data?: { name?: string; title?: string; overview?: string } }[] };
}

/** Détail d'une œuvre TMDB : synopsis, genres, bande-annonce (française d'abord). */
export async function tmdbDetail(sourceId: string): Promise<WorkCandidate> {
  const m = /^(tv|movie):(\d{1,10})$/.exec(sourceId);
  if (!m) throw new WorkSearchError("Identifiant TMDB invalide.", 400);
  const [, type, id] = m;
  const d = await tmdbGet<TmdbDetail>(`/${type}/${id}?append_to_response=videos,translations&include_video_language=fr,en,ja,null`);
  const base = toCandidate(d, type as "tv" | "movie");
  if (!base) throw new WorkSearchError("Œuvre sans titre en alphabet latin.", 404);
  // Le titre est français seulement si TMDB a une traduction française qui le donne.
  const fr = d.translations?.translations?.find((t) => t.iso_639_1 === "fr" && t.iso_3166_1 === "FR")
    ?? d.translations?.translations?.find((t) => t.iso_639_1 === "fr");
  const frName = clean(fr?.data?.name || fr?.data?.title);
  const en = d.translations?.translations?.find((t) => t.iso_639_1 === "en");
  const vids = (d.videos?.results ?? []).filter((v) => v.site === "YouTube" && /^[\w-]{11}$/.test(v.key));
  const order = (v: (typeof vids)[number]) => (v.iso_639_1 === "fr" ? 0 : v.iso_639_1 === "en" ? 1 : 2) * 10 + (v.type === "Trailer" ? 0 : v.type === "Teaser" ? 1 : 5) + (v.official ? 0 : 0.5);
  const best = vids.sort((a, b) => order(a) - order(b))[0];
  const trailer: WorkTrailer | undefined = best ? { youtubeId: best.key, lang: best.iso_639_1, name: best.name } : undefined;
  return {
    ...base,
    titleFr: frName && !hasJapanese(frName) ? frName : undefined,
    synopsisEn: clean(en?.data?.overview) || undefined,
    genres: d.genres?.map((g) => g.name).filter(Boolean).slice(0, 5),
    episodes: d.number_of_episodes,
    seasons: d.number_of_seasons,
    status: d.status,
    trailer,
  };
}
