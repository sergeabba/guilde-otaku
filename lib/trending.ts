// Tendances (cahier des charges V4.2, § 6) : ce qui monte cette saison, ce qui arrive
// la saison prochaine et les mangas du moment. Données AniList (sans clé), synopsis
// français quand une source française existe (TMDB / Wikipédia, jamais traduits),
// bande-annonce YouTube référencée par AniList. Aucun article, aucune donnée inventée :
// chaque fiche renvoie à sa source. Module serveur.
import { unstable_cache } from "next/cache";
import { frenchInfo } from "./airing";
import { hasJapanese } from "./member-extras";
import { frenchMangaSynopsis, trimSynopsis } from "./works/fr-synopsis";
import { nextSeason, seasonLabel, seasonOf } from "./season";

export const TRENDING_TABS = ["saison", "prochaine", "manga"] as const;
export type TrendingTab = (typeof TRENDING_TABS)[number];

export interface TrendingItem {
  id: number;
  rank: number;
  kind: "ANIME" | "MANGA";
  title: string;
  titleAlt: string | null;
  cover: string | null;
  banner: string | null;
  color: string | null;
  genres: string[];
  format: string | null;
  status: string | null;          // libellé français
  start: string | null;           // « 4 octobre 2026 », « octobre 2026 », « 2026 »
  episodes: number | null;
  nextEpisode: { episode: number; at: number } | null;
  score: number | null;           // moyenne AniList sur 100
  trailer: string | null;         // identifiant YouTube
  synopsis: string | null;        // français uniquement
  synopsisCredit: { label: string; url: string } | null;
  url: string;                    // fiche AniList
}

export interface TrendingResult {
  tab: TrendingTab;
  label: string;
  items: TrendingItem[];
  fetchedAt: string;
}

const STATUS_FR: Record<string, string> = { RELEASING: "En cours", FINISHED: "Terminé", NOT_YET_RELEASED: "À venir", HIATUS: "En pause", CANCELLED: "Annulé" };
const FORMAT_FR: Record<string, string> = { TV: "Série", TV_SHORT: "Série courte", MOVIE: "Film", ONA: "Web", OVA: "OVA", SPECIAL: "Spécial", MANGA: "Manga", ONE_SHOT: "One-shot", NOVEL: "Roman" };
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const GENRE_FR: Record<string, string> = {
  Action: "Action", Adventure: "Aventure", Comedy: "Comédie", Drama: "Drame", Ecchi: "Ecchi", Fantasy: "Fantasy", Horror: "Horreur",
  "Mahou Shoujo": "Magical girl", Mecha: "Mecha", Music: "Musique", Mystery: "Mystère", Psychological: "Psychologique", Romance: "Romance",
  "Sci-Fi": "Science-fiction", "Slice of Life": "Tranche de vie", Sports: "Sport", Supernatural: "Surnaturel", Thriller: "Thriller",
};

/** Date de début lisible : seules les parties connues sont affichées. */
export function startLabel(d?: { year?: number | null; month?: number | null; day?: number | null } | null): string | null {
  if (!d?.year) return null;
  if (!d.month) return String(d.year);
  return `${d.day ? `${d.day} ` : ""}${MONTHS[d.month - 1]} ${d.year}`;
}

const latin = (s?: string | null) => (s && !hasJapanese(s) ? s.trim() : null);

interface RawMedia {
  id: number; type: "ANIME" | "MANGA"; isAdult?: boolean;
  title: { romaji?: string | null; english?: string | null };
  coverImage?: { extraLarge?: string | null; large?: string | null; color?: string | null };
  bannerImage?: string | null; genres?: string[]; format?: string | null; status?: string | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  episodes?: number | null; averageScore?: number | null; siteUrl?: string | null; seasonYear?: number | null;
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
  trailer?: { id?: string | null; site?: string | null } | null;
}

const QUERY = `query($type:MediaType,$season:MediaSeason,$year:Int,$sort:[MediaSort]){Page(perPage:24){media(type:$type,season:$season,seasonYear:$year,sort:$sort,isAdult:false){
id type isAdult title{romaji english} coverImage{extraLarge large color} bannerImage genres format status startDate{year month day}
episodes averageScore siteUrl seasonYear nextAiringEpisode{episode airingAt} trailer{id site}}}}`;

async function anilist(vars: Record<string, unknown>): Promise<RawMedia[]> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: vars }),
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  return (await res.json())?.data?.Page?.media ?? [];
}

const YT_ID = /^[\w-]{11}$/;

/** Fiche affichable à partir d'une réponse AniList (sans synopsis). */
export function toItem(m: RawMedia, rank: number): TrendingItem | null {
  const romaji = latin(m.title.romaji), english = latin(m.title.english);
  const title = romaji ?? english;
  if (!title || m.isAdult) return null;
  return {
    id: m.id, rank, kind: m.type, title, titleAlt: english && english !== title ? english : null,
    cover: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
    banner: m.bannerImage ?? null,
    color: m.coverImage?.color && /^#[0-9a-f]{6}$/i.test(m.coverImage.color) ? m.coverImage.color : null,
    genres: (m.genres ?? []).filter((g) => g !== "Hentai").slice(0, 3).map((g) => GENRE_FR[g] ?? g),
    format: m.format ? FORMAT_FR[m.format] ?? null : null,
    status: m.status ? STATUS_FR[m.status] ?? null : null,
    start: startLabel(m.startDate),
    episodes: m.episodes ?? null,
    nextEpisode: m.nextAiringEpisode ? { episode: m.nextAiringEpisode.episode, at: m.nextAiringEpisode.airingAt } : null,
    score: m.averageScore ?? null,
    trailer: m.trailer?.site === "youtube" && m.trailer.id && YT_ID.test(m.trailer.id) ? m.trailer.id : null,
    synopsis: null, synopsisCredit: null,
    url: m.siteUrl ?? `https://anilist.co/${m.type.toLowerCase()}/${m.id}`,
  };
}

async function build(tab: TrendingTab, now: Date): Promise<TrendingResult> {
  const cur = seasonOf(now), nxt = nextSeason(cur);
  const vars = tab === "saison" ? { type: "ANIME", season: cur.season, year: cur.year, sort: ["TRENDING_DESC", "POPULARITY_DESC"] }
    : tab === "prochaine" ? { type: "ANIME", season: nxt.season, year: nxt.year, sort: ["POPULARITY_DESC"] }
    : { type: "MANGA", sort: ["TRENDING_DESC", "POPULARITY_DESC"] };
  const label = tab === "saison" ? seasonLabel(cur) : tab === "prochaine" ? seasonLabel(nxt) : "Mangas du moment";
  const raw = await anilist(vars);
  const items = raw.map((m) => toItem(m, 0)).filter((x): x is TrendingItem => !!x).slice(0, 12).map((x, i) => ({ ...x, rank: i + 1 }));

  // Synopsis français (sources françaises uniquement), par lots, chaque recherche en cache.
  const titlesOf = (it: TrendingItem) => [it.titleAlt, it.title].filter(Boolean) as string[];
  for (let i = 0; i < items.length; i += 6) {
    await Promise.all(items.slice(i, i + 6).map(async (it) => {
      if (it.kind === "ANIME") {
        const year = Number(it.start?.match(/\d{4}$/)?.[0]) || null;
        const fr = await frenchInfo(it.id, titlesOf(it), year).catch(() => null);
        if (fr?.synopsis) { it.synopsis = trimSynopsis(fr.synopsis); it.synopsisCredit = { label: "Synopsis : TMDB", url: "https://www.themoviedb.org/" }; }
        if (!it.banner && fr?.backdrop) it.banner = fr.backdrop;
      } else {
        const fr = await frenchMangaSynopsis(titlesOf(it)).catch(() => null);
        if (fr) { it.synopsis = fr.text; it.synopsisCredit = fr.credit; }
      }
    }));
  }
  return { tab, label, items, fetchedAt: now.toISOString() };
}

/** Tendances d'un onglet, en cache 6 h (une clé par onglet et par jour). */
export async function getTrending(tab: TrendingTab, now = new Date()): Promise<TrendingResult> {
  const day = now.toISOString().slice(0, 10);
  return unstable_cache(() => build(tab, now), ["trending-v1", tab, day], { revalidate: 6 * 3600, tags: ["trending"] })();
}
