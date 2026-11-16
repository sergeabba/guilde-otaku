import { NextRequest, NextResponse } from "next/server";
import { getPublicMembers } from "../../../../lib/members-server";
import { BADGE_RULES, computeBadges, NO_STATS } from "../../../../lib/games/badges";
import { memberStats } from "../../../../lib/games/store";

// Badges automatiques de chaque membre (?member=ID pour un seul). Recalculés à chaque appel, cache court.
export async function GET(req: NextRequest) {
  const only = Number(req.nextUrl.searchParams.get("member"));
  const [members, stats] = await Promise.all([getPublicMembers().catch(() => []), memberStats().catch(() => new Map())]);
  const list = members
    .filter((m) => !only || m.id === only)
    .map((m) => ({ id: m.id, name: m.name, image: m.animeChar || m.photo || null, badges: computeBadges(m.extras, stats.get(m.id) ?? NO_STATS) }));
  return NextResponse.json({ rules: BADGE_RULES, members: list }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
}
