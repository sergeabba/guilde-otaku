import { NextRequest, NextResponse } from "next/server";
import { EMPTY_ACTIVITY, memberActivity } from "../../../../lib/member-activity";
import { getPublicMembers } from "../../../../lib/members-server";

// Activité publique d'un membre (?id=) : records aux jeux, votes de films et du Bash.
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Membre inconnu." }, { status: 400 });
  const members = await getPublicMembers().catch(() => []);
  if (!members.some((m) => m.id === id)) return NextResponse.json({ error: "Membre inconnu." }, { status: 404 });
  const data = await memberActivity(id).catch(() => EMPTY_ACTIVITY);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
