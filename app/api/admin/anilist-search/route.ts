import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { hasJapanese } from "../../../../lib/member-extras";

const QUERY = `
  query ($search: String, $type: MediaType) {
    Page(perPage: 8) {
      media(search: $search, type: $type, sort: SEARCH_MATCH, isAdult: false) {
        id type format siteUrl
        title { romaji english native }
        startDate { year }
        coverImage { large }
        description(asHtml: false)
      }
    }
  }
`;

interface AniMedia {
  id: number; type: "ANIME" | "MANGA"; format: string | null; siteUrl: string | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  startDate: { year: number | null } | null;
  coverImage: { large: string | null } | null;
  description: string | null;
}

// Recherche AniList pour choisir explicitement une œuvre (homonymes possibles).
// Réservée à l'admin. Rien n'est enregistré ici : l'admin choisit, puis enregistre.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const search = typeof body?.search === "string" ? body.search.trim().slice(0, 100) : "";
  const type = body?.type === "MANGA" ? "MANGA" : body?.type === "ANIME" ? "ANIME" : null;
  if (search.length < 2 || !type) return NextResponse.json({ error: "Recherche trop courte" }, { status: 400 });

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { search, type } }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) return NextResponse.json({ error: "AniList limite les recherches : réessaie dans une minute" }, { status: 503 });
    if (!res.ok) return NextResponse.json({ error: `AniList indisponible (${res.status}) : utilise la saisie manuelle` }, { status: 502 });
    const json = await res.json();
    const media: AniMedia[] = json?.data?.Page?.media ?? [];
    const results = media.map((m) => ({
      source: "anilist" as const,
      sourceId: m.id,
      kind: m.type,
      titleNative: m.title.native ?? undefined, // conservé en interne, jamais affiché
      titleRomaji: m.title.romaji && !hasJapanese(m.title.romaji) ? m.title.romaji : undefined,
      titleLocalized: m.title.english && !hasJapanese(m.title.english) ? m.title.english : undefined,
      coverUrl: m.coverImage?.large ?? undefined,
      sourceUrl: m.siteUrl ?? undefined,
      year: m.startDate?.year ?? undefined,
      format: m.format ?? undefined,
      // Référence pour rédiger le synopsis français : jamais enregistrée telle quelle.
      descriptionEn: m.description ? m.description.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 900) : undefined,
    })).filter((r) => r.titleRomaji || r.titleLocalized);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "AniList injoignable : utilise la saisie manuelle" }, { status: 502 });
  }
}
