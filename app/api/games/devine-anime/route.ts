import { NextRequest, NextResponse } from "next/server";
import { dailyAnime, getDleAnimes } from "../../../../lib/games/dle";
import { animeHints, animeTries, compareAnime, dlePoints } from "../../../../lib/games/dle-logic";
import { parisDay } from "../../../../lib/games/arcade";
import { parseLevel, withMult, type Level } from "../../../../lib/games/levels";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay, todayPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });
// Partie d'avant les niveaux : même nonce qu'avant pour le niveau Normal.
const nonceOf = (level: Level, date: string, device: string) => (level === "normal" ? `devine-anime:${date}:${device}` : `devine-anime:${level}:${date}:${device}`);

async function load(date: string, level: Level) {
  const [list, secret] = await Promise.all([getDleAnimes(), dailyAnime(date, level)]);
  return { list, secret, byId: new Map(list.map((a) => [a.id, a])) };
}

// Devine l'anime du jour (un par niveau) : chaque essai dit ce qu'il a en commun avec l'anime mystère.
export async function GET(req: NextRequest) {
  const date = parisDay();
  const sp = req.nextUrl.searchParams;
  const level = parseLevel(sp.get("level"));
  try {
    const { list, secret, byId } = await load(date, level);
    const device = sp.get("device") ?? "", m = Number(sp.get("member"));
    const play = DEVICE.test(device) ? await todayPlay("devine-anime", date, device, Number.isInteger(m) && m > 0 ? m : null, level) : null;
    const guesses = play && Array.isArray(play.detail?.guesses) ? (play.detail.guesses as number[]).map((id) => byId.get(id)).filter(Boolean) : [];
    return NextResponse.json({
      date, level, tries: animeTries(level),
      names: list.map((a) => ({ id: a.id, title: a.title, alt: a.alt, year: a.year })),
      played: play ? { ok: !!play.detail?.ok, score: play.score, feedback: guesses.map((g) => compareAnime(g!, secret)), answer: secret } : null,
    }, { headers: NO_STORE });
  } catch {
    return fail("Jeu indisponible pour le moment (AniList ne répond pas).", 503);
  }
}

// Essais { guesses: [id, …], level } (toute la liste à chaque fois) : réponse pour chacun ; à la fin, l'anime mystère.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 60)) return fail("Doucement ! Réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const date = parisDay();
  const level = parseLevel(body?.level);
  const max = animeTries(level);
  const ids: number[] = Array.isArray(body?.guesses) ? body.guesses.map(Number) : [];
  if (!ids.length || ids.length > max || new Set(ids).size !== ids.length) return fail("Essais invalides.");
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  let data;
  try { data = await load(date, level); } catch { return fail("Jeu indisponible pour le moment.", 503); }
  const { secret, byId } = data;
  if (ids.some((id) => !byId.has(id))) return fail("Anime inconnu de la liste.");
  if (await todayPlay("devine-anime", date, player.device, player.member_id, level)) return fail("Tu as déjà joué à ce niveau aujourd'hui. Reviens demain !", 409);
  const feedback = ids.map((id) => compareAnime(byId.get(id)!, secret));
  const found = feedback.findIndex((f) => f.ok);
  if (found >= 0 && found < ids.length - 1) return fail("Essais invalides.");
  const over = found >= 0 || ids.length >= max;
  let saved = false, score = 0;
  if (over) {
    const tries = found >= 0 ? found + 1 : null;
    score = withMult(dlePoints(tries), level);
    saved = await recordPlay({ game: "devine-anime", ...player, score, max_score: withMult(100, level), detail: { date, level, ok: found >= 0, tries, guesses: ids }, nonce: nonceOf(level, date, player.device) }).catch(() => false);
  }
  return NextResponse.json({ feedback, over, ok: found >= 0, score, saved, hints: over ? [] : animeHints(secret, feedback.filter((f) => !f.ok).length, level), answer: over ? secret : null }, { headers: NO_STORE });
}
