// Données des jeux « Devine l'anime » et « Devine le perso » (AniList, sans clé) et
// secret du jour, figé par date (le même pour tout le monde). Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "../member-extras";
import { GENRE_FR } from "../trending";
import { pickDaily, type DleAnime, type DleChar } from "./dle-logic";

const FORMAT_FR: Record<string, string> = { TV: "Série", TV_SHORT: "Série courte", MOVIE: "Film", ONA: "Web", OVA: "OVA", SPECIAL: "Spécial" };
const SOURCE_FR: Record<string, string> = { ORIGINAL: "Original", MANGA: "Manga", LIGHT_NOVEL: "Light novel", VISUAL_NOVEL: "Visual novel", VIDEO_GAME: "Jeu vidéo", NOVEL: "Roman", WEB_NOVEL: "Web novel", OTHER: "Autre", WEB_MANGA: "Web manga", MULTIMEDIA_PROJECT: "Projet multimédia", PICTURE_BOOK: "Livre illustré", COMIC: "Comics", GAME: "Jeu", LIVE_ACTION: "Live action", DOUJINSHI: "Doujinshi", ANIME: "Anime" };
const ROLE_FR: Record<string, string> = { MAIN: "Personnage principal", SUPPORTING: "Personnage secondaire", BACKGROUND: "Figurant" };
const GENDER_FR: Record<string, string> = { Male: "Homme", Female: "Femme" };

const latin = (s?: string | null) => (s && !hasJapanese(s) ? s.trim() : null);
const genresFr = (g: string[] = []) => g.map((x) => GENRE_FR[x] ?? x);

async function anilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  return (await res.json()).data as T;
}

const ANIME_Q = `query($p:Int){Page(page:$p,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false,format_in:[TV,MOVIE,ONA]){id title{romaji english} seasonYear format episodes averageScore genres source studios(isMain:true){nodes{name}} coverImage{extraLarge large}}}}`;
interface RawAnime { id: number; title: { romaji?: string | null; english?: string | null }; seasonYear: number | null; format: string; episodes: number | null; averageScore: number | null; genres: string[]; source: string | null; studios: { nodes: { name: string }[] }; coverImage: { extraLarge?: string; large?: string } }

/** Les 300 animes les plus populaires (titres lisibles, année et note connues). */
export const getDleAnimes = unstable_cache(async (): Promise<DleAnime[]> => {
  const pages = await Promise.all([1, 2, 3, 4, 5, 6].map((p) => anilist<{ Page: { media: RawAnime[] } }>(ANIME_Q, { p })));
  const seen = new Set<string>(), out: DleAnime[] = [];
  for (const m of pages.flatMap((x) => x.Page.media)) {
    const title = latin(m.title.english) ?? latin(m.title.romaji);
    const cover = m.coverImage.extraLarge ?? m.coverImage.large;
    if (!title || !cover || !m.seasonYear || !m.averageScore || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    const alt = latin(m.title.romaji);
    out.push({ id: m.id, title, alt: alt && alt !== title ? alt : null, cover, year: m.seasonYear, format: FORMAT_FR[m.format] ?? m.format, episodes: m.episodes, score: m.averageScore, genres: genresFr(m.genres), studio: m.studios.nodes[0]?.name ?? null, source: m.source ? SOURCE_FR[m.source] ?? m.source : null });
  }
  if (out.length < 100) throw new Error("Liste d'animes incomplète.");
  return out;
}, ["dle-animes-v1"], { revalidate: 7 * 86_400 });

const CHAR_Q = `query($p:Int){Page(page:$p,perPage:50){characters(sort:FAVOURITES_DESC){id name{full alternative} gender age image{large} media(perPage:3,sort:POPULARITY_DESC,type:ANIME){edges{characterRole node{id title{romaji english} seasonYear genres}}}}}}`;
interface RawChar { id: number; name: { full: string | null; alternative: string[] }; gender: string | null; age: string | null; image: { large: string | null }; media: { edges: { characterRole: string; node: { id: number; title: { romaji?: string | null; english?: string | null }; seasonYear: number | null; genres: string[] } }[] } }

/** Les 200 personnages préférés des spectateurs d'AniList, rattachés à un anime. */
export const getDleChars = unstable_cache(async (): Promise<DleChar[]> => {
  const pages = await Promise.all([1, 2, 3, 4].map((p) => anilist<{ Page: { characters: RawChar[] } }>(CHAR_Q, { p })));
  const out: DleChar[] = [];
  for (const c of pages.flatMap((x) => x.Page.characters)) {
    const name = latin(c.name.full);
    const e = c.media.edges[0];
    const anime = e && (latin(e.node.title.english) ?? latin(e.node.title.romaji));
    if (!name || !c.image.large || !e || !anime) continue;
    const age = c.age && /^[0-9][0-9 ~+\-–]*$/.test(c.age.trim()) ? `${c.age.trim()} ans` : null;
    out.push({ id: c.id, name, alt: (c.name.alternative ?? []).map(latin).filter((x): x is string => !!x && x.length < 40).slice(0, 4), image: c.image.large, gender: c.gender ? GENDER_FR[c.gender] ?? "Autre" : null, age, role: ROLE_FR[e.characterRole] ?? "Personnage", anime, animeId: e.node.id, year: e.node.seasonYear, genres: genresFr(e.node.genres) });
  }
  if (out.length < 80) throw new Error("Liste de personnages incomplète.");
  return out;
}, ["dle-chars-v1"], { revalidate: 7 * 86_400 });

/** Titre de suite : « Season 2 », « 2nd Season », « Part 2 », « II », « Shippuden »… */
export const isSequel = (t: string) => /\b(season|saison|part|cour)\s*\d|\b\d+(st|nd|rd|th)\s+season|\s(ii|iii|iv|2|3|4)$|\s(ii|iii|iv|2|3|4)[:\s]|shippuu?den|final season|the movie|: .*arc\b/i.test(t);

/** Secret du jour, figé dans le cache pour la journée (même si la liste AniList bouge). */
export const dailyAnime = (date: string) => unstable_cache(async () => {
  // Les 150 plus populaires, hors suites (saison 2, partie 2, film dérivé…) : assez connus pour être devinés.
  const list = (await getDleAnimes()).filter((a) => !isSequel(a.title) && !isSequel(a.alt ?? "")).slice(0, 150);
  return list[pickDaily(date, list.length, "devine-anime")];
}, ["dle-anime-day-v2", date], { revalidate: 3 * 86_400 })();

export const dailyChar = (date: string) => unstable_cache(async () => {
  const list = (await getDleChars()).slice(0, 120);
  return list[pickDaily(date, list.length, "devine-perso")];
}, ["dle-char-day-v1", date], { revalidate: 3 * 86_400 })();
