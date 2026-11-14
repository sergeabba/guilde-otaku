// Cinéma Otaku : animes japonais disponibles légalement en France (TMDB, données
// de disponibilité JustWatch), bandes-annonces et plateformes. Module serveur.
import { unstable_cache } from "next/cache";
import { tmdbGet, tmdbPoster } from "./works/tmdb";

export type CinemaKind = "tv" | "movie";
export interface CinemaItem { kind: CinemaKind; id: number; title: string; overview: string | null; poster: string | null; backdrop: string | null; year: number | null; rating: number | null }
export interface Provider { id: number; name: string; logo: string }
export interface CinemaDetail { trailer: { key: string; lang: string } | null; link: string | null; included: Provider[]; free: Provider[]; rent: Provider[] }

interface Raw { id: number; name?: string; title?: string; overview?: string; poster_path?: string | null; backdrop_path?: string | null; first_air_date?: string; release_date?: string; vote_average?: number }

const IMG = "https://image.tmdb.org/t/p";
const toItem = (kind: CinemaKind) => (r: Raw): CinemaItem => {
  const date = r.first_air_date || r.release_date;
  return {
    kind, id: r.id, title: (r.name || r.title || "").trim(),
    overview: r.overview?.trim() || null,
    poster: tmdbPoster(r.poster_path, "w342") ?? null,
    backdrop: r.backdrop_path ? `${IMG}/w1280${r.backdrop_path}` : null,
    year: date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null,
    rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
  };
};

/** Rangées de la page : abonnement, gratuit (avec pubs), films. */
export const getCinemaRows = unstable_cache(async () => {
  const base = "with_genres=16&with_original_language=ja&watch_region=FR&sort_by=popularity.desc&include_adult=false";
  const [series, free, films] = await Promise.all([
    tmdbGet<{ results?: Raw[] }>(`/discover/tv?${base}&with_watch_monetization_types=flatrate`),
    tmdbGet<{ results?: Raw[] }>(`/discover/tv?${base}&with_watch_monetization_types=free|ads`),
    tmdbGet<{ results?: Raw[] }>(`/discover/movie?${base}&with_watch_monetization_types=flatrate|free|ads`),
  ]);
  const clean = (list: CinemaItem[]) => list.filter((i) => i.title && i.poster).slice(0, 20);
  return {
    series: clean((series.results ?? []).map(toItem("tv"))),
    free: clean((free.results ?? []).map(toItem("tv"))),
    films: clean((films.results ?? []).map(toItem("movie"))),
  };
}, ["cinema-rows-v1"], { revalidate: 60 * 60 * 6 });

interface ProvRaw { provider_id: number; provider_name: string; logo_path: string }
const prov = (l?: ProvRaw[]) => (l ?? []).map((p) => ({ id: p.provider_id, name: p.provider_name, logo: `${IMG}/w92${p.logo_path}` }));

/** Bande-annonce (VF, sinon VO) et plateformes en France pour un titre. */
export const getCinemaDetail = unstable_cache(async (kind: CinemaKind, id: number): Promise<CinemaDetail> => {
  const [videos, providers] = await Promise.all([
    tmdbGet<{ results?: { key: string; site: string; type: string; iso_639_1: string; official?: boolean }[] }>(`/${kind}/${id}/videos?include_video_language=fr,en,ja,null`),
    tmdbGet<{ results?: { FR?: { link?: string; flatrate?: ProvRaw[]; free?: ProvRaw[]; ads?: ProvRaw[]; rent?: ProvRaw[]; buy?: ProvRaw[] } } }>(`/${kind}/${id}/watch/providers`),
  ]);
  const yt = (videos.results ?? []).filter((v) => v.site === "YouTube" && /^[\w-]{11}$/.test(v.key));
  const pick = (lang: string) => yt.find((v) => v.iso_639_1 === lang && v.type === "Trailer") ?? yt.find((v) => v.iso_639_1 === lang && v.type === "Teaser");
  const t = pick("fr") ?? pick("en") ?? pick("ja") ?? yt.find((v) => v.type === "Trailer") ?? yt[0];
  const fr = providers.results?.FR;
  const seen = new Set<number>();
  const uniq = (l: Provider[]) => l.filter((p) => !seen.has(p.id) && seen.add(p.id));
  return {
    trailer: t ? { key: t.key, lang: t.iso_639_1 } : null,
    link: fr?.link ?? null,
    included: uniq(prov(fr?.flatrate)),
    free: uniq([...prov(fr?.free), ...prov(fr?.ads)]),
    rent: uniq([...prov(fr?.rent), ...prov(fr?.buy)]),
  };
}, ["cinema-detail-v1"], { revalidate: 60 * 60 * 12 });
