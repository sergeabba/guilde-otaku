import { NextRequest, NextResponse } from "next/server";

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

const QUERY = `
  query ($search: String) {
    Media(search: $search, sort: SEARCH_MATCH) {
      id title { romaji english }
      type format status
      description(asHtml: false)
      startDate { year }
      episodes chapters averageScore
      coverImage { extraLarge large color }
      bannerImage genres
      studios(isMain: true) { nodes { name } }
      trailer { id site }
    }
  }
`;

async function fetchOne(search: string) {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { search } }),
    });
    const json = await res.json();
    const media = json?.data?.Media ?? null;
    if (!media) return null;

    const titles = [media.title?.romaji, media.title?.english].filter(Boolean) as string[];
    const bestScore = titles.reduce((max, title) => Math.max(max, titleSimilarity(search, title)), 0);

    return bestScore >= 0.25 ? media : null;
  } catch {
    return null;
  }
}

// Auto-calcule le tier depuis le score AniList
function autoTier(score: number | null): string {
  if (!score) return "A définir";
  if (score >= 85) return "Chef-d'œuvre";
  if (score >= 70) return "Pépite";
  if (score >= 55) return "Bof";
  return "Surcoté";
}

export async function POST(req: NextRequest) {
  const { titles } = await req.json() as { titles: string[] };
  
  if (!titles?.length) return NextResponse.json({ results: [] });

  // Fetch en parallèle (max 5 à la fois pour éviter le rate limit AniList)
  const results = [];
  for (let i = 0; i < titles.length; i += 5) {
    const batch = titles.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(fetchOne));
    results.push(...batchResults);
    if (i + 5 < titles.length) await new Promise(r => setTimeout(r, 600)); // rate limit
  }

  return NextResponse.json({
    results: results.map((media, i) => ({
      query: titles[i],
      found: !!media,
      media: media ? {
        id: media.id,
        title: media.title.english || media.title.romaji,
        titleRomaji: media.title.romaji,
        type: media.type === "MANGA" ? "Manga" : "Anime",
        cover: media.coverImage?.extraLarge || media.coverImage?.large,
        banner: media.bannerImage,
        score: media.averageScore ? parseFloat((media.averageScore / 10).toFixed(1)) : 0,
        autoTier: autoTier(media.averageScore),
        status: media.status === "FINISHED" ? "Terminé" : media.status === "RELEASING" ? "En cours" : "À venir",
        synopsis: media.description ?? "",
        year: media.startDate?.year ?? null,
        episodes: media.episodes ?? media.chapters ?? null,
        genres: media.genres ?? [],
        studio: media.studios?.nodes?.[0]?.name ?? null,
        trailerUrl: media.trailer?.site === "youtube" ? `https://youtu.be/${media.trailer.id}` : null,
      } : null,
    })),
  });
}