import { NextRequest, NextResponse } from "next/server";
import { getAnimeSong, getFrenchSongs, SONG_COUNT, todayIndex } from "../../../lib/anime-song";

// Un autre générique au hasard (bouton « Un autre ») ou celui du jour.
// Paramètres : ?not=<index> pour éviter de retomber sur le même.
export async function GET(req: NextRequest) {
  // Section Nostalgie : tous les génériques français.
  if (req.nextUrl.searchParams.get("nostalgie") === "1") {
    return NextResponse.json({ songs: await getFrenchSongs() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  }
  const not = Number(req.nextUrl.searchParams.get("not"));
  const random = req.nextUrl.searchParams.get("random") === "1";
  let index = todayIndex();
  if (random) {
    do { index = Math.floor(Math.random() * SONG_COUNT); } while (SONG_COUNT > 1 && index === not);
  }
  const song = await getAnimeSong(index);
  if (!song) return NextResponse.json({ error: "Générique indisponible" }, { status: 404 });
  return NextResponse.json({ song }, { headers: { "Cache-Control": random ? "no-store" : "public, s-maxage=3600" } });
}
