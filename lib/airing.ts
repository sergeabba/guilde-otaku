// Calendrier des sorties : épisodes d'anime diffusés cette semaine (AniList,
// sans clé), avec les membres qui suivent chaque série (favoris de leur fiche).
// Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "./member-extras";
import { getPublicMembers } from "./members-server";

export interface AiringEpisode {
  at: number; // secondes (UTC)
  episode: number;
  total: number | null;
  mediaId: number;
  title: string;
  titleAlt: string | null;
  cover: string | null;
  color: string | null;
  popularity: number;
  url: string;
  genres: string[];
  followers: { id: number; name: string; image: string | null }[];
}

interface Raw {
  airingAt: number; episode: number;
  media: { id: number; title: { romaji?: string; english?: string }; coverImage?: { large?: string; color?: string }; popularity?: number; isAdult?: boolean; format?: string; episodes?: number | null; siteUrl?: string; genres?: string[] };
}

const QUERY = `query($a:Int,$b:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
airingSchedules(airingAt_greater:$a,airingAt_lesser:$b,sort:TIME){airingAt episode
media{id title{romaji english} coverImage{large color} popularity isAdult format episodes siteUrl genres}}}}`;

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
}, ["airing-week-v1"], { revalidate: 1800 });

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

  return raw
    .filter((r) => !r.media.isAdult && ["TV", "TV_SHORT", "ONA"].includes(r.media.format ?? ""))
    .map((r) => {
      const romaji = latin(r.media.title.romaji), english = latin(r.media.title.english);
      const title = romaji ?? english ?? "";
      const followers = new Map<number, AiringEpisode["followers"][number]>();
      for (const f of [...(byId.get(r.media.id) ?? []), ...(romaji ? byTitle.get(norm(romaji)) ?? [] : []), ...(english ? byTitle.get(norm(english)) ?? [] : [])]) followers.set(f.id, f);
      return {
        at: r.airingAt, episode: r.episode, total: r.media.episodes ?? null, mediaId: r.media.id,
        title, titleAlt: english && english !== title ? english : null,
        cover: r.media.coverImage?.large ?? null, color: r.media.coverImage?.color ?? null,
        popularity: r.media.popularity ?? 0, url: r.media.siteUrl ?? `https://anilist.co/anime/${r.media.id}`,
        genres: (r.media.genres ?? []).slice(0, 3), followers: [...followers.values()],
      };
    })
    .filter((e) => e.title);
}
