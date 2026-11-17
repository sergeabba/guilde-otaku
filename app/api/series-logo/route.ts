import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { TMDB_REF } from "../../../lib/member-extras";

// Logo officiel d'une série (TMDB, PNG transparent), pour remplacer le logo du grade
// par celui de l'anime du portrait. Français d'abord, puis anglais, puis sans texte :
// jamais de logo en écriture japonaise. Adresse gardée 30 jours.
const API = "https://api.themoviedb.org/3";

function auth(): { headers: Record<string, string>; param: string } {
  const token = process.env.TMDB_READ_TOKEN, key = process.env.TMDB_API_KEY;
  if (token) return { headers: { Authorization: `Bearer ${token}` }, param: "" };
  if (key) return { headers: {}, param: `&api_key=${encodeURIComponent(key)}` };
  throw new Error("TMDB non configuré");
}

const logoPath = (ref: string) => unstable_cache(async (): Promise<string | null> => {
  const [kind, id] = ref.split(":");
  const { headers, param } = auth();
  const res = await fetch(`${API}/${kind}/${id}/images?include_image_language=fr,en,null${param}`, { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const d = (await res.json()) as { logos?: { file_path: string; iso_639_1: string | null; vote_average: number }[] };
  const rank = (l: string | null) => (l === "fr" ? 0 : l === "en" ? 1 : l === null ? 2 : 9);
  const best = (d.logos ?? []).filter((l) => rank(l.iso_639_1) < 9).sort((a, b) => rank(a.iso_639_1) - rank(b.iso_639_1) || b.vote_average - a.vote_average)[0];
  return best ? best.file_path : null;
}, ["series-logo-v1", ref], { revalidate: 30 * 86_400 })();

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("tmdb") ?? "";
  if (!TMDB_REF.test(ref)) return new NextResponse("Série invalide", { status: 400 });
  try {
    const path = await logoPath(ref);
    if (!path) return new NextResponse("Pas de logo", { status: 404, headers: { "Cache-Control": "public, s-maxage=86400" } });
    return NextResponse.redirect(`https://image.tmdb.org/t/p/w500${path}`, { status: 307, headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" } });
  } catch {
    return new NextResponse("Logo indisponible", { status: 502 });
  }
}
