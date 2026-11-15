import { NextRequest } from "next/server";
import { PAGE_IDS, renderPageOg, type PageId } from "../../../../lib/og/page-art";

// Image d'aperçu d'une rubrique : /api/og/page?p=bibliotheque&v=20261115
// Rendu en PNG puis converti en JPEG (léger : WhatsApp ignore les images trop lourdes).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const p = searchParams.get("p") as PageId;
  if (!PAGE_IDS.includes(p)) return new Response("Rubrique inconnue", { status: 400 });
  try {
    const png = Buffer.from(await (await renderPageOg(p, origin)).arrayBuffer());
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error("[og/page]", err);
    return new Response("Aperçu indisponible", { status: 500 });
  }
}
