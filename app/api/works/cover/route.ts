import { NextRequest, NextResponse } from "next/server";
import { fetchMangadexCover } from "../../../../lib/works/mangadex";

// Proxy des couvertures MangaDex (leur règle interdit l'appel direct depuis un autre site).
// Public car affiché sur les fiches ; limité aux couvertures MangaDex valides,
// mis en cache longtemps par le CDN pour ne solliciter MangaDex qu'une fois.
export async function GET(req: NextRequest) {
  const md = req.nextUrl.searchParams.get("md") ?? "";
  const small = req.nextUrl.searchParams.get("size") === "256";
  const m = /^([0-9a-f-]{36})\/([\w-]{1,80}\.(?:jpg|jpeg|png|webp))$/i.exec(md);
  if (!m) return NextResponse.json({ error: "Couverture invalide" }, { status: 400 });
  try {
    const res = await fetchMangadexCover(m[1], m[2], small ? 256 : 512);
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return NextResponse.json({ error: "Réponse inattendue" }, { status: 502 });
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Couverture indisponible" }, { status: 502 });
  }
}
