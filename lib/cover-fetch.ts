// ─── UTILITAIRES COVER FETCH ─────────────────────────────────────────────────

export const FALLBACK_COVER = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop";

// Cache en mémoire pour éviter de re-fetch à chaque render
export const coverCache = new Map<string, string>();

/**
 * Petit délai pour respecter le rate-limit AniList (90 req/min)
 */
export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calcule un score de similarité entre deux chaînes (0 à 1)
 * Utilisé pour valider que le résultat AniList correspond bien à la recherche
 */
function titleSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  // Jaccard similarity sur les mots
  const wordsA = new Set(na.split(" ").filter(w => w.length > 1));
  const wordsB = new Set(nb.split(" ").filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * PRIORITÉ 0 : AniList par ID (100% fiable)
 * Quand on connaît l'ID AniList exact, on fetch directement par ID.
 */
export async function fetchFromAniListById(id: number): Promise<string | null> {
  const cacheKey = `anilist-id-${id}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `
          query ($id: Int) {
            Media(id: $id) {
              id
              coverImage { extraLarge large }
            }
          }
        `,
        variables: { id },
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const media = json?.data?.Media;
    if (!media) return null;

    const cover = media.coverImage?.extraLarge || media.coverImage?.large;
    if (cover) {
      coverCache.set(cacheKey, cover);
      return cover;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * PRIORITÉ 1 : AniList par recherche textuelle (meilleure source pour les animes)
 * - Utilise Page pour obtenir plusieurs résultats
 * - Valide la similarité du titre pour éviter les faux positifs
 * - Essaie d'abord avec type ANIME, puis sans restriction de type
 */
export async function fetchFromAniList(query: string): Promise<string | null> {
  const cached = coverCache.get(`anilist-${query}`);
  if (cached) return cached;

  // Essai 1 : recherche type ANIME
  let cover = await _searchAniList(query, "ANIME");

  // Essai 2 : recherche sans restriction de type (pour les mangas adaptés, etc.)
  if (!cover) {
    cover = await _searchAniList(query, null);
  }

  return cover;
}

async function _searchAniList(query: string, type: string | null): Promise<string | null> {
  try {
    const typeFilter = type ? `, type: ${type}` : "";
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `
          query ($search: String!) {
            Page(perPage: 8) {
              media(search: $search${typeFilter}, sort: SEARCH_MATCH) {
                id
                title { romaji english native }
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

    // Chercher le meilleur match par similarité de titre
    let bestMatch: { cover: string; score: number } | null = null;

    for (const media of results) {
      const cover = media.coverImage?.extraLarge || media.coverImage?.large;
      if (!cover) continue;

      // Calculer la similarité avec chaque variante du titre
      const titles = [
        media.title?.english,
        media.title?.romaji,
        media.title?.native,
      ].filter(Boolean) as string[];

      let maxSim = 0;
      for (const t of titles) {
        const sim = titleSimilarity(query, t);
        if (sim > maxSim) maxSim = sim;
      }

      // Seuil minimum de similarité : 0.25 (au moins quelques mots en commun)
      if (maxSim >= 0.25 && (!bestMatch || maxSim > bestMatch.score)) {
        bestMatch = { cover, score: maxSim };
      }
    }

    // Si AniList ne trouve rien d'assez proche, on laisse les fallbacks
    // (TMDB/MangaDex) prendre le relais au lieu de forcer un faux positif.
    if (bestMatch) {
      coverCache.set(`anilist-${query}`, bestMatch.cover);
      return bestMatch.cover;
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
      match = findBestTMDBMatch(
        json.results?.filter((r: any) => r.media_type === "tv" || r.media_type === "movie"),
        query
      );
    }

    if (match) {
      const cover = `https://image.tmdb.org/t/p/w780${match.poster_path}`;
      coverCache.set(`tmdb-${query}`, cover);
      return cover;
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

  const scored = withPoster
    .map((result: any) => {
      const titles = [
        result.name,
        result.original_name,
        result.title,
        result.original_title,
      ].filter(Boolean) as string[];

      let similarity = 0;
      for (const title of titles) {
        similarity = Math.max(similarity, titleSimilarity(query, title));
      }

      return {
        result,
        similarity,
        isAnimation: result.genre_ids?.includes(16) ? 1 : 0,
        popularity: result.popularity ?? 0,
      };
    })
    .filter((entry) => entry.similarity >= 0.2);

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    if (b.isAnimation !== a.isAnimation) return b.isAnimation - a.isAnimation;
    return b.popularity - a.popularity;
  });

  return scored[0].result;
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
 * Nettoie un titre de recherche pour maximiser les chances de match.
 * Moins agressif que l'ancienne version : garde les mots importants
 * comme "Season" et les caractères japonais.
 */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/\b(trailer|official|pv|opening|ending|op|ed)\b/gi, "")
    .replace(/[()[\]{}]/g, " ")   // retire les parenthèses/crochets
    .replace(/\s+/g, " ")         // normalise les espaces
    .trim();
}

/**
 * Fonction maîtresse qui essaie toutes les sources dans l'ordre.
 * Supporte un anilistId optionnel pour un fetch direct (100% fiable).
 */
export async function fetchBestCover(query: string, anilistId?: number): Promise<string> {
  // Priorité 0 : fetch par ID AniList (le plus fiable)
  if (anilistId) {
    const byId = await fetchFromAniListById(anilistId);
    if (byId) return byId;
  }

  const clean = cleanSearchQuery(query);
  
  // Priorité 1 : recherche AniList par texte
  const aniList = await fetchFromAniList(clean);
  if (aniList) return aniList;

  // Essayer aussi avec le query brut si le nettoyage a changé quelque chose
  if (clean !== query) {
    const aniListRaw = await fetchFromAniList(query);
    if (aniListRaw) return aniListRaw;
  }
  
  // Priorité 2 : TMDB
  const tmdb = await fetchFromTMDB(clean);
  if (tmdb) return tmdb;
  
  // Priorité 3 : MangaDex
  const mangaDex = await fetchFromMangaDex(clean);
  if (mangaDex) return mangaDex;
  
  return FALLBACK_COVER;
}
