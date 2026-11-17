import { NextRequest, NextResponse } from "next/server";
import { dailyAnime, getDleAnimes } from "../../../../lib/games/dle";
import { compareAnime, dlePoints, DLE_TRIES } from "../../../../lib/games/dle-logic";
import { parisDay } from "../../../../lib/games/arcade";
import { DEVICE, ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay, todayPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

async function load(date: string) {
  const [list, secret] = await Promise.all([getDleAnimes(), dailyAnime(date)]);
  return { list, secret, byId: new Map(list.map((a) => [a.id, a])) };
}

// Devine l'anime du jour en 6 essais : chaque essai dit ce qu'il a en commun avec l'anime mystère.
export async function GET(req: NextRequest) {
  const date = parisDay();
  const sp = req.nextUrl.searchParams;
  try {
    const { list, secret, byId } = await load(date);
    const device = sp.get("device") ?? "", m = Number(sp.get("member"));
    const play = DEVICE.test(device) ? await todayPlay("devine-anime", date, device, Number.isInteger(m) && m > 0 ? m : null) : null;
    const guesses = play && Array.isArray(play.detail?.guesses) ? (play.detail.guesses as number[]).map((id) => byId.get(id)).filter(Boolean) : [];
    return NextResponse.json({
      date, tries: DLE_TRIES,
      names: list.map((a) => ({ id: a.id, title: a.title, alt: a.alt, year: a.year })),
      played: play ? { ok: !!play.detail?.ok, score: play.score, feedback: guesses.map((g) => compareAnime(g!, secret)), answer: secret } : null,
    }, { headers: NO_STORE });
  } catch {
    return fail("Jeu indisponible pour le moment (AniList ne répond pas).", 503);
  }
}

// Essais { guesses: [id, …] } (toute la liste à chaque fois) : réponse pour chacun ; à la fin, l'anime mystère.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 60)) return fail("Doucement ! Réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const date = parisDay();
  const ids: number[] = Array.isArray(body?.guesses) ? body.guesses.map(Number) : [];
  if (!ids.length || ids.length > DLE_TRIES || new Set(ids).size !== ids.length) return fail("Essais invalides.");
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  let data;
  try { data = await load(date); } catch { return fail("Jeu indisponible pour le moment.", 503); }
  const { secret, byId } = data;
  if (ids.some((id) => !byId.has(id))) return fail("Anime inconnu de la liste.");
  if (await todayPlay("devine-anime", date, player.device, player.member_id)) return fail("Tu as déjà joué aujourd'hui. Reviens demain !", 409);
  const feedback = ids.map((id) => compareAnime(byId.get(id)!, secret));
  const found = feedback.findIndex((f) => f.ok);
  // Un essai après la bonne réponse n'a pas de sens.
  if (found >= 0 && found < ids.length - 1) return fail("Essais invalides.");
  const over = found >= 0 || ids.length >= DLE_TRIES;
  let saved = false, score = 0;
  if (over) {
    const tries = found >= 0 ? found + 1 : null;
    score = dlePoints(tries);
    saved = await recordPlay({ game: "devine-anime", ...player, score, max_score: 100, detail: { date, ok: found >= 0, tries, guesses: ids }, nonce: `devine-anime:${date}:${player.device}` }).catch(() => false);
  }
  return NextResponse.json({ feedback, over, ok: found >= 0, score, saved, answer: over ? secret : null }, { headers: NO_STORE });
}
