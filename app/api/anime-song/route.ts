import { NextRequest, NextResponse } from "next/server";
import { getAnimeSong, SONG_COUNT, todayIndex } from "../../../lib/anime-song";

// Un autre générique au hasard (bouton « Un autre ») ou celui du jour.
// Paramètres : ?not=<index> pour éviter de retomber sur le même.
export async function GET(req: NextRequest) {
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
