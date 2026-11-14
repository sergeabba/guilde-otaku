import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { workDetail, WorkSearchError } from "../../../../lib/works";

const NO_STORE = { "Cache-Control": "no-store" };

// Détail d'une œuvre choisie (synopsis, genres, bande-annonce). Réservé à l'admin.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const source = body?.source === "tmdb" || body?.source === "mangadex" ? body.source : null;
  const id = typeof body?.id === "string" ? body.id.slice(0, 64) : "";
  if (!source || !id) return NextResponse.json({ error: "Source ou identifiant manquant." }, { status: 400, headers: NO_STORE });
  try {
    return NextResponse.json({ work: await workDetail(source, id) }, { headers: NO_STORE });
  } catch (err) {
    const e = err instanceof WorkSearchError ? err : new WorkSearchError("Service injoignable.");
    return NextResponse.json({ error: e.message }, { status: e.status, headers: NO_STORE });
  }
}
