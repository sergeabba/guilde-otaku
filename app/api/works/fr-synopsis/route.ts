import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { frenchMangaSynopsis } from "../../../../lib/works/fr-synopsis";

// Synopsis français d'un manga déjà enregistré (Wikipédia FR, sinon adaptation animée).
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  const titles = Array.isArray(body?.titles) ? body.titles.filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0).map((t: string) => t.slice(0, 200)).slice(0, 3) : [];
  if (!titles.length) return NextResponse.json({ error: "Titre manquant." }, { status: 400 });
  const found = await frenchMangaSynopsis(titles).catch(() => null);
  return NextResponse.json({ synopsis: found }, { headers: { "Cache-Control": "no-store" } });
}
