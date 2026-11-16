import { NextRequest } from "next/server";
import { getAtelierWork } from "../../../../lib/atelier-server";
import { renderAtelierOg } from "../../../../lib/og/atelier-art";

// Aperçu de lien d'une futilité : /api/og/atelier?f=<nom de fichier | drive:id>
// Rendu en PNG puis converti en JPEG léger (WhatsApp ignore les images trop lourdes).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const work = await getAtelierWork(searchParams.get("f") ?? "").catch(() => null);
  if (!work) return new Response("Futilité introuvable", { status: 404 });
  try {
    const png = Buffer.from(await (await renderAtelierOg(work, origin)).arrayBuffer());
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    console.error("[og/atelier]", err);
    return new Response("Aperçu indisponible", { status: 500 });
  }
}
