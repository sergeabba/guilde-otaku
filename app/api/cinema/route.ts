import { NextRequest, NextResponse } from "next/server";
import { getCinemaDetail, getCinemaRows } from "../../../lib/cinema";

// Détail d'un titre pour la salle de projection : bande-annonce et plateformes en France.
export async function GET(req: NextRequest) {
  // ?list=1 : index léger des titres à l'affiche (recherche globale).
  if (req.nextUrl.searchParams.get("list") === "1") {
    try {
      const r = await getCinemaRows();
      const items = [...r.series, ...r.free, ...r.films].map((i) => ({ kind: i.kind, id: i.id, title: i.title, year: i.year, poster: i.poster }));
      return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=21600" } });
    } catch {
      return NextResponse.json({ items: [] }, { status: 502 });
    }
  }
  const kind = req.nextUrl.searchParams.get("kind");
  const id = Number(req.nextUrl.searchParams.get("id"));
  if ((kind !== "tv" && kind !== "movie") || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  try {
    return NextResponse.json({ detail: await getCinemaDetail(kind, id) }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "TMDB ne répond pas : réessaie." }, { status: 502 });
  }
}
