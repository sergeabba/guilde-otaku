import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { lookupLink, searchItunes, searchLinks } from "../../../../lib/music-search";
import { parseMusicLink } from "../../../../lib/music";

const NO_STORE = { "Cache-Control": "no-store" };

// Recherche de musique pour l'admin. Rien n'est enregistré ici :
// l'admin choisit un résultat, le corrige si besoin, puis enregistre la fiche.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const input = typeof body?.q === "string" ? body.q.trim().slice(0, 300) : "";
  if (input.length < 2) return NextResponse.json({ error: "Tape un titre, un artiste ou colle un lien." }, { status: 400, headers: NO_STORE });

  try {
    if (/^https?:\/\//i.test(input) || parseMusicLink(input)) {
      if (!parseMusicLink(input)) return NextResponse.json({ error: "Lien non reconnu (Spotify, Apple Music ou YouTube attendu)." }, { status: 400, headers: NO_STORE });
      const ref = parseMusicLink(input)!;
      try {
        const found = await lookupLink(input);
        return NextResponse.json({ results: found ? [found] : [], links: null }, { headers: NO_STORE });
      } catch {
        // Lien valide mais service muet : le morceau reste utilisable, titre et artiste à saisir.
        return NextResponse.json({ results: [{ ...ref, source: "lien" }], links: null, notice: "Informations non récupérées : renseigne le titre et l'artiste." }, { headers: NO_STORE });
      }
    }
    const results = await searchItunes(input);
    return NextResponse.json({ results, links: searchLinks(input) }, { headers: NO_STORE });
  } catch (err) {
    const message = err instanceof Error && !/fetch failed|aborted|timeout/i.test(err.message) ? err.message : "Service de recherche injoignable : colle directement le lien du morceau.";
    return NextResponse.json({ error: message, links: searchLinks(input) }, { status: 502, headers: NO_STORE });
  }
}
