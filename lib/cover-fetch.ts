// ─── UTILITAIRES COVER FETCH ─────────────────────────────────────────────────

export const FALLBACK_COVER = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop";

// Cache en mémoire pour éviter de re-fetch à chaque render
export const coverCache = new Map<string, string>();

/**
 * Petit délai pour respecter le rate-limit AniList (90 req/min)
 */
export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * PRIORITÉ 1 : AniList (meilleure source pour les animes)
 * - Utilise Page pour obtenir plusieurs résultats
 * - Prend le premier résultat ANIME avec une cover
 * - Récupère bannerImage en bonus (utile pour le hero)
 */
export async function fetchFromAniList(query: string): Promise<string | null> {
  const cached = coverCache.get(`anilist-${query}`);
  if (cached) return cached;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `
          query ($search: String!) {
            Page(perPage: 5) {
              media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
                id
                title { romaji english }
                coverImage { extraLarge large }
              }
            }
          }
        `,
        variables: { search: query },
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const results = json?.data?.Page?.media;

    if (!results || results.length === 0) return null;

    // On prend le premier résultat qui a une cover extraLarge ou large
    for (const media of results) {
      const cover = media.coverImage?.extraLarge || media.coverImage?.large;
      if (cover) {
        coverCache.set(`anilist-${query}`, cover);
        return cover;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * PRIORITÉ 2 : TMDB (fallback, surtout bon pour les adaptations connues)
 * - Utilise search/tv (les animes sont des séries TV sur TMDB)
 * - Filtre par genre Animation (id: 16) pour éviter les faux positifs
 * - Trie par popularité
 */
export async function fetchFromTMDB(query: string): Promise<string | null> {
  const cached = coverCache.get(`tmdb-${query}`);
  if (cached) return cached;

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    // Essai 1 : Recherche en anglais (meilleure couverture pour les animes)
    let res = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false`
    );
    let json = await res.json();
    let match = findBestTMDBMatch(json.results, query);

    // Essai 2 : Si rien trouvé, on essaie en japonais
    if (!match) {
      res = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=ja-JP&query=${encodeURIComponent(query)}&include_adult=false`
      );
      json = await res.json();
      match = findBestTMDBMatch(json.results, query);
    }

    // Essai 3 : Dernier recours avec search/multi (films, etc.)
    if (!match) {
      res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false`
      );
      json = await res.json();
      const multiMatch = json.results
        ?.filter((r: any) => r.poster_path && (r.media_type === "tv" || r.media_type === "movie"))
        .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))[0];

      if (multiMatch) {
        const cover = `https://image.tmdb.org/t/p/w780${multiMatch.poster_path}`;
        coverCache.set(`tmdb-${query}`, cover);
        return cover;
      }
    }

    if (match) {
      const cover = `https://image.tmdb.org/t/p/w780${match.poster_path}`;
      coverCache.set(`tmdb-${query}`, cover);
      return cover;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Trouve le meilleur résultat TMDB :
 * - Priorité aux résultats Animation (genre_id: 16)
 * - Trié par popularité décroissante
 */
function findBestTMDBMatch(results: any[] | undefined, query: string): any | null {
  if (!results || results.length === 0) return null;

  const withPoster = results.filter((r: any) => r.poster_path);
  if (withPoster.length === 0) return null;

  // Priorité : résultats du genre Animation (16)
  const animationResults = withPoster.filter((r: any) =>
    r.genre_ids?.includes(16)
  );

  // Si on a des résultats Animation, on prend le plus populaire parmi eux
  // Sinon, on prend le plus populaire tout court
  const pool = animationResults.length > 0 ? animationResults : withPoster;
  return pool.sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))[0];
}

/**
 * PRIORITÉ 3 : MangaDex (dernier recours, surtout pour les mangas purs)
 */
export async function fetchFromMangaDex(query: string): Promise<string | null> {
  const cached = coverCache.get(`mangadex-${query}`);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&limit=3&order[relevance]=desc`
    );
    const json = await res.json();

    if (!json.data || json.data.length === 0) return null;

    for (const manga of json.data) {
      const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
      const fileName = coverRel?.attributes?.fileName;
      if (fileName) {
        const cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`;
        coverCache.set(`mangadex-${query}`, cover);
        return cover;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Nettoie un titre de recherche pour maximiser les chances de match
 */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/\banime\b/gi, "")
    .replace(/\bseason\s*\d+\b/gi, "")
    .replace(/\bS\d+\b/gi, "")
    .replace(/\b(trailer|official|pv)\b/gi, "")
    .replace(/[^\w\s'-]/g, " ")  // retire les caractères spéciaux
    .replace(/\s+/g, " ")         // normalise les espaces
    .trim();
}

/**
 * Fonction maîtresse qui essaie toutes les sources dans l'ordre
 */
export async function fetchBestCover(query: string): Promise<string> {
  const clean = cleanSearchQuery(query);
  
  const aniList = await fetchFromAniList(clean);
  if (aniList) return aniList;
  
  const tmdb = await fetchFromTMDB(clean);
  if (tmdb) return tmdb;
  
  const mangaDex = await fetchFromMangaDex(clean);
  if (mangaDex) return mangaDex;
  
  return FALLBACK_COVER;
}
