import { NextResponse } from "next/server";
import { driveConfig, getGuildVideos } from "../../../../lib/drive";

// Vidéos de la Guilde (dossier Google Drive du Cinéma), reprises dans les Futilités.
// Liste vide si Drive n'est pas configuré ou ne répond pas : la galerie reste utilisable.
export async function GET() {
  if (!driveConfig()) return NextResponse.json({ videos: [] });
  try {
    const videos = (await getGuildVideos()).flatMap((c) => c.videos);
    return NextResponse.json({ videos }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
  } catch {
    return NextResponse.json({ videos: [], error: "Google Drive indisponible." }, { status: 502 });
  }
}
