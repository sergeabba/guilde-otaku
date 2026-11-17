// Données des jeux « Devine l'anime » et « Devine le perso » (AniList, sans clé) et
// secret du jour, figé par date (le même pour tout le monde). Module serveur.
import { unstable_cache } from "next/cache";
import { catalogAnimes, catalogChars } from "./catalog";
import type { Level } from "./levels";
import { pickDaily, type DleAnime, type DleChar } from "./dle-logic";

/** Les 600 animes les plus populaires (titres lisibles, année et note connues). */
export async function getDleAnimes(): Promise<DleAnime[]> {
  const list = (await catalogAnimes(600)).filter((a) => a.year && a.score);
  if (list.length < 100) throw new Error("Liste d'animes incomplète.");
  return list.map((a) => ({ id: a.id, title: a.title, alt: a.alt, cover: a.cover, year: a.year!, format: a.format, episodes: a.episodes, score: a.score!, genres: a.genres, studio: a.studio, source: a.source, tags: a.tags, rank: a.rank }));
}

/** Les 600 personnages préférés des spectateurs d'AniList, rattachés à un anime. */
export async function getDleChars(): Promise<DleChar[]> {
  const list = await catalogChars(600);
  if (list.length < 80) throw new Error("Liste de personnages incomplète.");
  return list.map((c) => ({ id: c.id, name: c.name, alt: c.alt, image: c.image, gender: c.gender, age: c.age, role: c.role, anime: c.anime, animeId: c.animeId, year: c.year, genres: c.genres, voice: c.voice, rank: c.rank }));
}

/** Titre de suite : « Season 2 », « 2nd Season », « Part 2 », « II », « Shippuden »… */
export const isSequel = (t: string) => /\b(season|saison|part|cour)\s*\d|\b\d+(st|nd|rd|th)\s+season|\s(ii|iii|iv|2|3|4)$|\s(ii|iii|iv|2|3|4)[:\s]|shippuu?den|final season|the movie|: .*arc\b/i.test(t);

/** Plages de rangs des secrets du jour selon le niveau. */
const ANIME_RANGE: Record<Level, [number, number]> = { facile: [1, 100], normal: [1, 150], expert: [151, 600] };
const CHAR_RANGE: Record<Level, [number, number]> = { facile: [1, 100], normal: [1, 120], expert: [201, 600] };

/** Secret du jour par niveau, figé dans le cache pour la journée (même si la liste AniList bouge). */
export const dailyAnime = (date: string, level: Level = "normal") => unstable_cache(async () => {
  const [lo, hi] = ANIME_RANGE[level];
  const list = (await getDleAnimes()).filter((a) => (a.rank ?? 0) >= lo && (a.rank ?? 0) <= hi && !isSequel(a.title) && !isSequel(a.alt ?? ""));
  return list[pickDaily(date, list.length, level === "normal" ? "devine-anime" : `devine-anime-${level}`)];
}, level === "normal" ? ["dle-anime-day-v2", date] : ["dle-anime-day-v3", level, date], { revalidate: 3 * 86_400 })();

export const dailyChar = (date: string, level: Level = "normal") => unstable_cache(async () => {
  const [lo, hi] = CHAR_RANGE[level];
  const list = (await getDleChars()).filter((c) => (c.rank ?? 0) >= lo && (c.rank ?? 0) <= hi);
  return list[pickDaily(date, list.length, level === "normal" ? "devine-perso" : `devine-perso-${level}`)];
}, level === "normal" ? ["dle-char-day-v1", date] : ["dle-char-day-v2", level, date], { revalidate: 3 * 86_400 })();
