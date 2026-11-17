import { NextRequest } from "next/server";
import sharp from "sharp";
import { getPublicMember, parseMemberId } from "../../../../lib/members-server";
import { renderMemberCard, SHARE_CACHE } from "../../../../lib/og/member-art";

// Carte Otaku téléchargeable : /api/card/member?id=14&v=<version>[&hd=1][&download=1]
// hd=1 : version 2K (2160 × 2700, JPEG haute qualité : léger, donc rapide à enregistrer sur iPhone).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const id = parseMemberId(searchParams.get("id"));
  if (id === null) return new Response("Identifiant invalide", { status: 400 });

  try {
    const found = await getPublicMember(id);
    if (!found) return new Response("Membre introuvable", { status: 404 });
    let img: Response = await renderMemberCard(found.member, origin);
    // hd=1 : carte agrandie en 2K (2160 × 2700), Lanczos + légère accentuation de la netteté.
    if (searchParams.get("hd") === "1") {
      const big = await sharp(Buffer.from(await img.arrayBuffer())).resize(2160, 2700, { kernel: "lanczos3" }).sharpen({ sigma: 0.7 }).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
      img = new Response(new Uint8Array(big), { headers: { "Content-Type": "image/jpeg" } });
    }
    img.headers.set("Cache-Control", SHARE_CACHE);
    if (searchParams.get("download") === "1") {
      const slug = found.member.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `membre-${id}`;
      img.headers.set("Content-Disposition", `attachment; filename="carte-otaku-${slug}.${searchParams.get("hd") === "1" ? "jpg" : "png"}"`);
    }
    return img;
  } catch (err) {
    console.error("[card/member]", err);
    return new Response("Carte indisponible", { status: 500 });
  }
}
