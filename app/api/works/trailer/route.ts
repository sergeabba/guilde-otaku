import { NextRequest, NextResponse } from "next/server";
import { getTrailer } from "../../../../lib/works/trailer";

// Bande-annonce d'un anime favori (fiches des membres). Public, en cache.
//   ?source=tmdb&id=tv:37854   ou   ?source=anilist&id=21
export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("source");
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const ok = (source === "tmdb" && /^(tv|movie):\d{1,9}$/.test(id)) || (source === "anilist" && /^\d{1,9}$/.test(id));
  if (!ok) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  try {
    const trailer = await getTrailer(source as "tmdb" | "anilist", id);
    return NextResponse.json({ trailer }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ trailer: null }, { status: 502 });
  }
}
