import { NextRequest } from "next/server";
import { getPublicMember, parseMemberId } from "../../../../lib/members-server";
import { renderMemberCard, SHARE_CACHE } from "../../../../lib/og/member-art";

// Carte Otaku téléchargeable : /api/card/member?id=14&v=<version>[&download=1]
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const id = parseMemberId(searchParams.get("id"));
  if (id === null) return new Response("Identifiant invalide", { status: 400 });

  try {
    const found = await getPublicMember(id);
    if (!found) return new Response("Membre introuvable", { status: 404 });
    const img = await renderMemberCard(found.member, origin);
    img.headers.set("Cache-Control", SHARE_CACHE);
    if (searchParams.get("download") === "1") {
      const slug = found.member.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `membre-${id}`;
      img.headers.set("Content-Disposition", `attachment; filename="carte-otaku-${slug}.png"`);
    }
    return img;
  } catch (err) {
    console.error("[card/member]", err);
    return new Response("Carte indisponible", { status: 500 });
  }
}
