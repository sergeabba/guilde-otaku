import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAiringWeek } from "../../../../lib/airing";
import { getTrending } from "../../../../lib/trending";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { saveTier, tierRows } from "../../../../lib/games/store";
import { cleanRanks, isoWeek, tierResults, tierTwins, type TierRow } from "../../../../lib/games/tier";
import { getPublicMembers } from "../../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Les animes à classer cette semaine : ceux du calendrier des sorties (diffusés cette semaine
 * sur Crunchyroll), en commençant par ceux que suivent le plus de membres, puis les plus
 * populaires. Complété par les tendances de la saison s'il en manque. Liste figée pour la
 * semaine (même liste pour tout le monde du lundi au dimanche).
 */
const weekItems = () => unstable_cache(async () => {
  const airing = await getAiringWeek().catch(() => []);
  const seen = new Set<number>();
  const fromCalendar = [...airing]
    .sort((a, b) => b.followers.length - a.followers.length || b.popularity - a.popularity)
    .filter((e) => (seen.has(e.mediaId) ? false : (seen.add(e.mediaId), true)))
    .slice(0, 12)
    .map((e) => ({ id: e.mediaId, title: e.title, cover: e.cover, followers: e.followers.map((f) => f.name) }));
  if (fromCalendar.length >= 12) return fromCalendar;
  const t = await getTrending("saison").catch(() => null);
  const extra = (t?.items ?? []).filter((i) => i.kind === "ANIME" && !seen.has(i.id)).slice(0, 12 - fromCalendar.length)
    .map((i) => ({ id: i.id, title: i.title, cover: i.cover, followers: [] as string[] }));
  return [...fromCalendar, ...extra];
}, ["tier-items-v2", isoWeek()], { revalidate: 7 * 86_400 })();

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
