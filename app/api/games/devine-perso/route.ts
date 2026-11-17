import { NextRequest, NextResponse } from "next/server";
import { dailyChar, getDleChars } from "../../../../lib/games/dle";
import { charHints, dlePoints, DLE_TRIES, type DleChar } from "../../../../lib/games/dle-logic";
import { parisDay } from "../../../../lib/games/arcade";
import { parseLevel, withMult, type Level } from "../../../../lib/games/levels";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay, todayPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });
const imageOf = (date: string, lv: Level) => (level: 1 | 2) => `/api/games/devine-perso/image?d=${date}&l=${level}${lv === "normal" ? "" : `&v=${lv}`}`;
const nonceOf = (level: Level, date: string, device: string) => (level === "normal" ? `devine-perso:${date}:${device}` : `devine-perso:${level}:${date}:${device}`);
const verdict = (g: DleChar, s: DleChar) => ({ id: g.id, name: g.name, anime: g.anime, ok: g.id === s.id, sameAnime: g.animeId === s.animeId, sameGender: !!g.gender && g.gender === s.gender });
const reveal = (s: DleChar) => ({ name: s.name, anime: s.anime, image: s.image });

async function load(date: string, level: Level) {
  const [list, secret] = await Promise.all([getDleChars(), dailyChar(date, level)]);
  return { list, secret, byId: new Map(list.map((c) => [c.id, c])) };
}

// Devine le perso du jour : indices dévoilés un par un, un de plus à chaque essai raté.
export async function GET(req: NextRequest) {
  const date = parisDay();
  const sp = req.nextUrl.searchParams;
  const level = parseLevel(sp.get("level"));
  try {
    const { list, secret, byId } = await load(date, level);
    const device = sp.get("device") ?? "", m = Number(sp.get("member"));
    const play = DEVICE.test(device) ? await todayPlay("devine-perso", date, device, Number.isInteger(m) && m > 0 ? m : null, level) : null;
    const guesses = play && Array.isArray(play.detail?.guesses) ? (play.detail.guesses as number[]).map((id) => byId.get(id)).filter((x): x is DleChar => !!x) : [];
    return NextResponse.json({
      date, level, tries: DLE_TRIES,
      names: list.map((c) => ({ id: c.id, name: c.name, alt: c.alt, anime: c.anime })),
      hints: charHints(secret, play ? DLE_TRIES : 0, imageOf(date, level), level),
      played: play ? { ok: !!play.detail?.ok, score: play.score, feedback: guesses.map((g) => verdict(g, secret)), answer: reveal(secret) } : null,
    }, { headers: NO_STORE });
  } catch {
    return fail("Jeu indisponible pour le moment (AniList ne répond pas).", 503);
  }
}

export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 60)) return fail("Doucement ! Réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const date = parisDay();
  const level = parseLevel(body?.level);
  const ids: number[] = Array.isArray(body?.guesses) ? body.guesses.map(Number) : [];
  if (!ids.length || ids.length > DLE_TRIES || new Set(ids).size !== ids.length) return fail("Essais invalides.");
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  let data;
  try { data = await load(date, level); } catch { return fail("Jeu indisponible pour le moment.", 503); }
  const { secret, byId } = data;
  if (ids.some((id) => !byId.has(id))) return fail("Personnage inconnu de la liste.");
  if (await todayPlay("devine-perso", date, player.device, player.member_id, level)) return fail("Tu as déjà joué à ce niveau aujourd'hui. Reviens demain !", 409);
  const feedback = ids.map((id) => verdict(byId.get(id)!, secret));
  const found = feedback.findIndex((f) => f.ok);
  if (found >= 0 && found < ids.length - 1) return fail("Essais invalides.");
  const over = found >= 0 || ids.length >= DLE_TRIES;
  let saved = false, score = 0;
  if (over) {
    const tries = found >= 0 ? found + 1 : null;
    score = withMult(dlePoints(tries), level);
    saved = await recordPlay({ game: "devine-perso", ...player, score, max_score: withMult(100, level), detail: { date, level, ok: found >= 0, tries, guesses: ids }, nonce: nonceOf(level, date, player.device) }).catch(() => false);
  }
  const wrong = feedback.filter((f) => !f.ok).length;
  return NextResponse.json({ feedback, over, ok: found >= 0, score, saved, hints: charHints(secret, over ? DLE_TRIES : wrong, imageOf(date, level), level), answer: over ? reveal(secret) : null }, { headers: NO_STORE });
}
