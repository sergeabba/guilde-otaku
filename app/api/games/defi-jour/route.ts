import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAnimeSong } from "../../../../lib/anime-song";
import { buildDaily, dailyPoints, dailyStreak, openDaily, parisDay, type DailyMember } from "../../../../lib/games/arcade";
import { getAnimePool } from "../../../../lib/games/pool";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { dailyHistory, leaderboard, recordPlay } from "../../../../lib/games/store";
import { getPublicMembers } from "../../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };

async function dailyMembers(): Promise<DailyMember[]> {
  const members = await getPublicMembers().catch(() => []);
  return [...members].sort((a, b) => a.id - b.id).map((m) => ({
    id: m.id, name: m.name,
    favorites: (m.extras?.favoriteAnime ?? []).map((w) => w.titleLocalized || w.titleRomaji || "").filter(Boolean),
  })).filter((m) => m.favorites.length);
}

// Le même défi pour tout le monde ce jour-là : construit une fois par date.
const todays = (date: string) => unstable_cache(async () => {
  const [pool, members] = await Promise.all([getAnimePool().catch(() => []), dailyMembers()]);
  return buildDaily(date, pool, members, async (i) => (await getAnimeSong(i).catch(() => null))?.preview ?? null);
}, ["defi-jour-v1", date], { revalidate: 86_400 })();

const nonceOf = (date: string, device: string) => `jour:${date}:${device}`;

// Défi du jour, état du joueur (déjà joué ? série en cours) et classement du jour.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 40)) return NextResponse.json({ error: "Trop de requêtes, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const sp = req.nextUrl.searchParams;
  const date = parisDay();
  const device = sp.get("device") ?? "";
  const member = Number(sp.get("member"));
  const [challenge, mine, board] = await Promise.all([
    todays(date).catch(() => null),
    DEVICE.test(device) ? dailyHistory(device, Number.isInteger(member) && member > 0 ? member : null) : Promise.resolve([]),
    leaderboard("defi-jour", 20, date),
  ]);
  const today = mine.find((p) => p.detail?.date === date);
  const streak = dailyStreak(mine.map((p) => ({ date: String(p.detail?.date ?? ""), ok: p.score > 0 })), date);
  if (!challenge) return NextResponse.json({ error: "Pas de défi disponible aujourd'hui (sources indisponibles).", date, streak }, { status: 503, headers: NO_STORE });
  const played = today ? { score: today.score, ok: today.score > 0, reveal: String(today.detail?.reveal ?? ""), chosen: today.detail?.chosen ?? null } : null;
  return NextResponse.json({ date, challenge, played, streak, board }, { headers: NO_STORE });
}

// Réponse { token, choice, ms } : une seule tentative par appareil et par jour.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de requêtes, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const key = openDaily(body?.token);
  if (!key || key.date !== parisDay()) return NextResponse.json({ error: "Ce défi est terminé : recharge la page pour celui d'aujourd'hui." }, { status: 400, headers: NO_STORE });
  const player = await parsePlayer(body);
  if (typeof player === "string") return NextResponse.json({ error: player }, { status: 400, headers: NO_STORE });
  const choice = Number.isInteger(body?.choice) ? Number(body.choice) : null;
  const ok = choice === key.answer;
  const score = dailyPoints(ok, Number(body?.ms));
  let saved = false;
  try {
    saved = await recordPlay({ game: "defi-jour", ...player, score, max_score: 150, detail: { date: key.date, kind: key.kind, ok, chosen: choice, reveal: key.reveal }, nonce: nonceOf(key.date, player.device) });
  } catch {
    return NextResponse.json({ error: "Tu as déjà joué le défi d'aujourd'hui. Reviens demain !" }, { status: 409, headers: NO_STORE });
  }
  return NextResponse.json({ ok, score, answer: key.answer, reveal: key.reveal, saved }, { headers: NO_STORE });
}
