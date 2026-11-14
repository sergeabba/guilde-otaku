import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { searchWorks, WorkSearchError } from "../../../../lib/works";

const NO_STORE = { "Cache-Control": "no-store" };

// Recherche d'œuvres pour l'administration (favoris des membres et Bibliothèque).
// Réservée à l'admin : protège la clé TMDB et le quota MangaDex. Rien n'est enregistré ici.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const q = typeof body?.q === "string" ? body.q : "";
  const kind = body?.kind === "MANGA" ? "MANGA" : body?.kind === "ANIME" ? "ANIME" : null;
  if (!kind) return NextResponse.json({ error: "Type d'œuvre manquant (anime ou manga)." }, { status: 400, headers: NO_STORE });
  try {
    const results = await searchWorks(q, kind);
    return NextResponse.json({ results }, { headers: NO_STORE });
  } catch (err) {
    const e = err instanceof WorkSearchError ? err : new WorkSearchError("Service de recherche injoignable : utilise la saisie manuelle.");
    return NextResponse.json({ error: e.message }, { status: e.status, headers: NO_STORE });
  }
}
