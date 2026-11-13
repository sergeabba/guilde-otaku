import { NextRequest } from "next/server";
import { getPublicMember, parseMemberId } from "../../../../lib/members-server";
import { renderGuildOg, renderMemberOg, SHARE_CACHE } from "../../../../lib/og/member-art";

// Aperçu social d'un membre : /api/og/member?id=14&v=<version>
// Seul l'identifiant est lu. Les anciennes URL (name, photo, color en paramètres)
// ne sont plus interprétées : elles reçoivent l'image générique de la Guilde.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const id = parseMemberId(searchParams.get("id"));

  try {
    let png: Response;
    if (id === null) {
      png = await renderGuildOg();
    } else {
      const found = await getPublicMember(id);
      if (!found) return new Response("Membre introuvable", { status: 404 });
      png = await renderMemberOg(found.member, origin);
    }
    return await asJpeg(png);
  } catch (err) {
    console.error("[og/member]", err);
    return new Response("Image indisponible", { status: 500 });
  }
}

/**
 * Les aperçus de messagerie ignorent souvent les images lourdes : une photo en PNG
 * dépasse vite 700 Ko. On renvoie un JPEG (~100 à 200 Ko), ou le PNG si la conversion échoue.
 */
async function asJpeg(png: Response): Promise<Response> {
  const buf = Buffer.from(await png.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(buf).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": SHARE_CACHE } });
  } catch (err) {
    console.error("[og/member] conversion JPEG impossible, envoi en PNG", err);
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/png", "Cache-Control": SHARE_CACHE } });
  }
}
