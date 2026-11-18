// Catalogue AniList des jeux (sans clé) : 800 animes et 600 personnages, classés par
// popularité, avec thèmes (traduits), créateur, réalisateur, studio, doubleur japonais.
// AniList limite à 30 requêtes par minute : le catalogue est chargé par blocs de 200,
// chacun gardé 7 jours en cache. Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "../member-extras";
import { GENRE_FR } from "../trending";
import { TAG_FR } from "./tags-fr";

export interface CatAnime { rank: number; id: number; title: string; alt: string | null; cover: string; year: number | null; format: string; episodes: number | null; score: number | null; popularity: number; genres: string[]; studio: string | null; source: string | null; tags: string[]; creator: string | null; director: string | null }
export interface CatChar { rank: number; id: number; name: string; alt: string[]; image: string; gender: string | null; age: string | null; role: string; anime: string; animeId: number; animeRank: number | null; year: number | null; genres: string[]; voice: string | null; native?: string | null; voiceNative?: string | null }

const FORMAT_FR: Record<string, string> = { TV: "Série", TV_SHORT: "Série courte", MOVIE: "Film", ONA: "Web", OVA: "OVA", SPECIAL: "Spécial" };
const SOURCE_FR: Record<string, string> = { ORIGINAL: "Original", MANGA: "Manga", LIGHT_NOVEL: "Light novel", VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Jeu vidéo", NOVEL: "Roman", WEB_NOVEL: "Web novel", OTHER: "Autre", WEB_MANGA: "Web manga", MULTIMEDIA_PROJECT: "Projet multimédia", PICTURE_BOOK: "Livre illustré", COMIC: "Comics", GAME: "Jeu", LIVE_ACTION: "Live action", DOUJINSHI: "Doujinshi", ANIME: "Anime" };
const ROLE_FR: Record<string, string> = { MAIN: "Personnage principal", SUPPORTING: "Personnage secondaire", BACKGROUND: "Figurant" };
const GENDER_FR: Record<string, string> = { Male: "Homme", Female: "Femme" };
const PAGE = 50, BLOCK = 4; // 4 pages de 50 = 200 par bloc

const latin = (s?: string | null) => (s && !hasJapanese(s) ? s.trim() : null);

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15_000) });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, Math.min(Number(res.headers.get("retry-after")) || 5, 20) * 1000)); continue; }
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    return (await res.json()).data as T;
  }
  throw new Error("AniList : trop de requêtes");
}

const ANIME_Q = `query($p:Int){Page(page:$p,perPage:${PAGE}){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false,format_in:[TV,MOVIE,ONA]){id title{romaji english} seasonYear format episodes averageScore popularity genres source studios(isMain:true){nodes{name}} coverImage{extraLarge large} tags{name rank isMediaSpoiler} staff(perPage:6,sort:RELEVANCE){edges{role node{name{full}}}}}}}`;
interface RawAnime { id: number; title: { romaji?: string | null; english?: string | null }; seasonYear: number | null; format: string; episodes: number | null; averageScore: number | null; popularity: number; genres: string[]; source: string | null; studios: { nodes: { name: string }[] }; coverImage: { extraLarge?: string; large?: string }; tags: { name: string; rank: number; isMediaSpoiler: boolean }[]; staff: { edges: { role: string; node: { name: { full: string | null } } }[] } }

/** Thèmes sûrs (ni spoiler, ni sans traduction), les plus pertinents d'abord. */
export function safeTags(tags: RawAnime["tags"]): string[] {
  return tags.filter((t) => !t.isMediaSpoiler && t.rank >= 55 && TAG_FR[t.name]).sort((a, b) => b.rank - a.rank).map((t) => TAG_FR[t.name]).slice(0, 8);
}
const staffName = (m: RawAnime, re: RegExp) => latin(m.staff.edges.find((e) => re.test(e.role))?.node.name.full ?? null);

export function toCatAnime(m: RawAnime, rank: number): CatAnime | null {
  const title = latin(m.title.english) ?? latin(m.title.romaji);
  const cover = m.coverImage.extraLarge ?? m.coverImage.large;
  if (!title || !cover) return null;
  const alt = latin(m.title.romaji);
  return {
    rank, id: m.id, title, alt: alt && alt !== title ? alt : null, cover, year: m.seasonYear, format: FORMAT_FR[m.format] ?? m.format, episodes: m.episodes,
    score: m.averageScore, popularity: m.popularity, genres: m.genres.map((g) => GENRE_FR[g] ?? g), studio: m.studios.nodes[0]?.name ?? null,
    source: m.source ? SOURCE_FR[m.source] ?? m.source : null, tags: safeTags(m.tags),
    creator: staffName(m, /^Original (Creator|Story)/i), director: staffName(m, /^Director\b/i),
  };
}

const animeBlock = (b: number) => unstable_cache(async (): Promise<CatAnime[]> => {
  const pages = await Promise.all(Array.from({ length: BLOCK }, (_, k) => b * BLOCK + k + 1).map((p) => anilist<{ Page: { media: RawAnime[] } }>(ANIME_Q, { p }).then((d) => ({ p, list: d.Page.media }))));
  return pages.flatMap(({ p, list }) => list.map((m, i) => toCatAnime(m, (p - 1) * PAGE + i + 1))).filter((x): x is CatAnime => !!x);
}, ["catalog-anime-v1", String(b)], { revalidate: 7 * 86_400 })();

/** Les animes jusqu'au rang `maxRank` (800 au plus), titres en double écartés. */
export async function catalogAnimes(maxRank = 200): Promise<CatAnime[]> {
  const blocks = await Promise.all(Array.from({ length: Math.ceil(Math.min(maxRank, 800) / 200) }, (_, b) => animeBlock(b)));
  const seen = new Set<string>();
  return blocks.flat().filter((a) => a.rank <= maxRank && !seen.has(a.title.toLowerCase()) && (seen.add(a.title.toLowerCase()), true));
}

const CHAR_Q = `query($p:Int){Page(page:$p,perPage:${PAGE}){characters(sort:FAVOURITES_DESC){id name{full alternative native} gender age image{large} media(perPage:2,sort:POPULARITY_DESC,type:ANIME){edges{characterRole voiceActors(language:JAPANESE,sort:RELEVANCE){name{full native}} node{id title{romaji english} seasonYear genres popularity}}}}}}`;
interface RawChar { id: number; name: { full: string | null; alternative: string[]; native?: string | null }; gender: string | null; age: string | null; image: { large: string | null }; media: { edges: { characterRole: string; voiceActors: { name: { full: string | null; native?: string | null } }[]; node: { id: number; title: { romaji?: string | null; english?: string | null }; seasonYear: number | null; genres: string[] } }[] } }

export function toCatChar(c: RawChar, rank: number): CatChar | null {
  const name = latin(c.name.full);
  const e = c.media.edges[0];
  const anime = e && (latin(e.node.title.english) ?? latin(e.node.title.romaji));
  if (!name || !c.image.large || !e || !anime) return null;
  const age = c.age && /^[0-9][0-9 ~+\-–]*$/.test(c.age.trim()) ? `${c.age.trim()} ans` : null;
  return {
    rank, id: c.id, name, alt: (c.name.alternative ?? []).map(latin).filter((x): x is string => !!x && x.length < 40).slice(0, 4), image: c.image.large,
    gender: c.gender ? GENDER_FR[c.gender] ?? "Autre" : null, age, role: ROLE_FR[e.characterRole] ?? "Personnage", anime, animeId: e.node.id, animeRank: null,
    year: e.node.seasonYear, genres: e.node.genres.map((g) => GENRE_FR[g] ?? g), voice: latin(e.voiceActors[0]?.name.full ?? null),
    // Noms japonais : servent seulement à chercher des extraits de voix (jamais affichés).
    native: c.name.native?.trim() || null, voiceNative: e.voiceActors[0]?.name.native?.trim() || null,
  };
}

const charBlock = (b: number) => unstable_cache(async (): Promise<CatChar[]> => {
  const pages = await Promise.all(Array.from({ length: BLOCK }, (_, k) => b * BLOCK + k + 1).map((p) => anilist<{ Page: { characters: RawChar[] } }>(CHAR_Q, { p }).then((d) => ({ p, list: d.Page.characters }))));
  return pages.flatMap(({ p, list }) => list.map((c, i) => toCatChar(c, (p - 1) * PAGE + i + 1))).filter((x): x is CatChar => !!x);
}, ["catalog-char-v2", String(b)], { revalidate: 7 * 86_400 })();

/** Les personnages jusqu'au rang `maxRank` (600 au plus). */
export async function catalogChars(maxRank = 200): Promise<CatChar[]> {
  const blocks = await Promise.all(Array.from({ length: Math.ceil(Math.min(maxRank, 600) / 200) }, (_, b) => charBlock(b)));
  return blocks.flat().filter((c) => c.rank <= maxRank);
}
