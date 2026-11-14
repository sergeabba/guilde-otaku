// Calendrier des sorties Crunchyroll : épisodes diffusés cette semaine (AniList,
// sans clé) dont la série est proposée sur Crunchyroll (liens officiels recensés
// par AniList), avec synopsis français (TMDB, jamais l'anglais à la place) et les
// membres qui suivent chaque série. Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "./member-extras";
import { getPublicMembers } from "./members-server";
import { tmdbGet } from "./works/tmdb";

export interface AiringEpisode {
  at: number; // secondes (UTC)
  episode: number;
  total: number | null;
  mediaId: number;
  title: string;
  titleAlt: string | null;
  cover: string | null;
  banner: string | null;
  color: string | null;
  synopsis: string | null;
  crunchyroll: string;
  popularity: number;
  url: string;
  genres: string[];
  followers: { id: number; name: string; image: string | null }[];
}

interface Raw {
  airingAt: number; episode: number;
  media: { id: number; title: { romaji?: string; english?: string }; coverImage?: { extraLarge?: string; large?: string; color?: string }; bannerImage?: string | null; popularity?: number; isAdult?: boolean; format?: string; episodes?: number | null; siteUrl?: string; genres?: string[]; seasonYear?: number | null; externalLinks?: { site?: string; url?: string }[] };
}

const QUERY = `query($a:Int,$b:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){airingAt episode
media{id title{romaji english} coverImage{extraLarge large color} bannerImage popularity isAdult format episodes siteUrl genres seasonYear externalLinks{site url}}}}}`;

const latin = (s?: string | null) => (s && !hasJapanese(s) ? s.trim() : null);

const fetchWeek = unstable_cache(async (from: number, to: number) => {
  const out: Raw[] = [];
  for (let page = 1; page <= 4; page++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { a: from, b: to, p: page } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const data = (await res.json())?.data?.Page;
    out.push(...(data?.airingSchedules ?? []));
    if (!data?.pageInfo?.hasNextPage) break;
  }
  return out;
}, ["airing-week-v2"], { revalidate: 1800 });

/** Synopsis français et image large d'une série (TMDB, recherche par titre), mis en cache. */
const frenchInfo = unstable_cache(async (mediaId: number, titles: string[], year: number | null) => {
  for (const t of titles) {
    const r = await tmdbGet<{ results?: { id: number; overview?: string; backdrop_path?: string | null; genre_ids?: number[]; first_air_date?: string }[] }>(`/search/tv?query=${encodeURIComponent(t)}&include_adult=false`);
    const hit = (r.results ?? []).find((x) => x.genre_ids?.includes(16) && (!year || !x.first_air_date || Math.abs(Number(x.first_air_date.slice(0, 4)) - year) <= 25));
    if (hit) return { synopsis: hit.overview?.trim() || null, backdrop: hit.backdrop_path ? `https://image.tmdb.org/t/p/w1280${hit.backdrop_path}` : null, mediaId };
  }
  return { synopsis: null, backdrop: null, mediaId };
}, ["airing-fr-v1"], { revalidate: 60 * 60 * 24 });

/** Épisodes de -12 h à +7 jours, séries et ONA tout public, triés par heure. */
export async function getAiringWeek(): Promise<AiringEpisode[]> {
  // Fenêtre arrondie à l'heure : une même clé de cache pendant une heure.
  const hour = Math.floor(Date.now() / 3_600_000) * 3600;
  const [raw, members] = await Promise.all([fetchWeek(hour - 12 * 3600, hour + 7 * 86400), getPublicMembers().catch(() => [])]);

  // Qui suit quoi : identifiant AniList des favoris, sinon titre normalisé.
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const byId = new Map<number, AiringEpisode["followers"]>();
  const byTitle = new Map<string, AiringEpisode["followers"]>();
  for (const m of members) {
    const who = { id: m.id, name: m.name, image: m.animeChar || m.photo || null };
    for (const w of m.extras?.favoriteAnime ?? []) {
      const id = w.anilistId ?? (w.source === "anilist" ? Number(w.sourceId) : undefined);
      if (id) byId.set(id, [...(byId.get(id) ?? []), who]);
      for (const t of [w.titleRomaji, w.titleLocalized]) if (t) byTitle.set(norm(t), [...(byTitle.get(norm(t)) ?? []), who]);
    }
  }

  const crunchy = (r: Raw) => r.media.externalLinks?.find((l) => l.site === "Crunchyroll" && l.url?.startsWith("https://www.crunchyroll.com/"))?.url;
  const list = raw.filter((r) => !r.media.isAdult && ["TV", "TV_SHORT", "ONA"].includes(r.media.format ?? "") && crunchy(r));

  // Synopsis français : une recherche TMDB par série (en cache 24 h), par lots.
  const fr = new Map<number, { synopsis: string | null; backdrop: string | null }>();
  const ids = [...new Map(list.map((r) => [r.media.id, r])).values()];
  for (let i = 0; i < ids.length; i += 8) {
    await Promise.all(ids.slice(i, i + 8).map(async (r) => {
      const titles = [latin(r.media.title.english), latin(r.media.title.romaji)].filter(Boolean) as string[];
      const info = await frenchInfo(r.media.id, titles, r.media.seasonYear ?? null).catch(() => null);
      if (info) fr.set(r.media.id, info);
    }));
  }

  return list
    .map((r) => {
      const romaji = latin(r.media.title.romaji), english = latin(r.media.title.english);
      const title = romaji ?? english ?? "";
      const followers = new Map<number, AiringEpisode["followers"][number]>();
      for (const f of [...(byId.get(r.media.id) ?? []), ...(romaji ? byTitle.get(norm(romaji)) ?? [] : []), ...(english ? byTitle.get(norm(english)) ?? [] : [])]) followers.set(f.id, f);
      return {
        at: r.airingAt, episode: r.episode, total: r.media.episodes ?? null, mediaId: r.media.id,
        title, titleAlt: english && english !== title ? english : null,
        cover: r.media.coverImage?.extraLarge ?? r.media.coverImage?.large ?? null,
        banner: r.media.bannerImage ?? fr.get(r.media.id)?.backdrop ?? null,
        color: r.media.coverImage?.color ?? null,
        synopsis: fr.get(r.media.id)?.synopsis ?? null,
        crunchyroll: crunchy(r)!,
        popularity: r.media.popularity ?? 0, url: r.media.siteUrl ?? `https://anilist.co/anime/${r.media.id}`,
        genres: (r.media.genres ?? []).slice(0, 3), followers: [...followers.values()],
      };
    })
    .filter((e) => e.title);
}
