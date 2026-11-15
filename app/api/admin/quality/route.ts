import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";
import { auditMedia, mediaRefs, validateMembers, type RawMemberRow } from "../../../../lib/services/member-quality";

const NO_STORE = { "Cache-Control": "no-store" };
export const maxDuration = 60;

// Contrôles qualité des fiches (lecture seule) : même logique que `npm run members:validate`.
// ?links=1 vérifie aussi que chaque image répond. Rien n'est modifié.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const { data, error } = await db.from("fighters").select("id, name, birthday, bio, badge, rankjp, photo, animechar, hidden, extras").order("id");
  if (error) return NextResponse.json({ error: `Lecture des membres impossible : ${error.message}` }, { status: 502, headers: NO_STORE });
  const rows = (data ?? []) as RawMemberRow[];
  const report = validateMembers(rows);
  const media = req.nextUrl.searchParams.get("links") === "1" ? await auditMedia(mediaRefs(rows), req.nextUrl.origin) : null;
  return NextResponse.json({ ...report, media }, { headers: NO_STORE });
}
