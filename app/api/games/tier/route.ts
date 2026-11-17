import { NextRequest, NextResponse } from "next/server";
import { getTrending } from "../../../../lib/trending";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { saveTier, tierRows } from "../../../../lib/games/store";
import { cleanRanks, isoWeek, tierResults, tierTwins, type TierRow } from "../../../../lib/games/tier";
import { getPublicMembers } from "../../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };

/** Les 12 animes les plus suivis de la saison en cours (AniList). */
async function weekItems() {
  const t = await getTrending("saison").catch(() => null);
  return (t?.items ?? []).filter((i) => i.kind === "ANIME").slice(0, 12).map((i) => ({ id: i.id, title: i.title, cover: i.cover }));
}

// Tier list de la semaine : animes à classer, classement du joueur, moyenne et « jumeaux ».
export async function GET(req: NextRequest) {
  const week = isoWeek();
  const device = req.nextUrl.searchParams.get("device") ?? "";
  const [items, { available, rows }, members] = await Promise.all([weekItems(), tierRows(week), getPublicMembers().catch(() => [])]);
  const names = new Map(members.map((m) => [m.id, m.name]));
  const clean: TierRow[] = rows.map((r) => ({ device: r.device, member_id: r.member_id, player_name: r.player_name, ranks: Array.isArray(r.ranks) ? r.ranks : [] }));
  const label = (r: TierRow) => (r.member_id && names.get(r.member_id)) || r.player_name || "Un invité";
  // Les « jumeaux » ne comparent que des joueurs qui ont dit qui ils sont.
  const named = clean.filter((r) => r.member_id || r.player_name);
  const mine = DEVICE.test(device) ? clean.find((r) => r.device === device)?.ranks ?? null : null;
  return NextResponse.json({ week, available, items, mine, voters: clean.length, results: tierResults(clean), twins: tierTwins(named, label) }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop d'envois, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const player = await parsePlayer(body);
  if (typeof player === "string") return NextResponse.json({ error: player }, { status: 400, headers: NO_STORE });
  const items = await weekItems();
  const ranks = cleanRanks(body?.ranks, new Map(items.map((i) => [i.id, { title: i.title, cover: i.cover }])));
  if (ranks.length < 3) return NextResponse.json({ error: "Classe au moins 3 animes." }, { status: 400, headers: NO_STORE });
  const err = await saveTier({ week: isoWeek(), ...player, ranks });
  if (err) return NextResponse.json({ error: err }, { status: 503, headers: NO_STORE });
  return NextResponse.json({ saved: true }, { headers: NO_STORE });
}
