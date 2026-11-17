import { NextRequest, NextResponse } from "next/server";
import { buildPlusMoins, openPlusMoins, pmPoints, stepPlusMoins } from "../../../../lib/games/arcade";
import { parseLevel } from "../../../../lib/games/levels";
import { getAnimePool, levelPool } from "../../../../lib/games/pool";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { nonceUsed, recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Plus ou moins : la note de chaque anime n'est révélée qu'après la réponse, par le serveur.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  try {
    const level = parseLevel(req.nextUrl.searchParams.get("level"));
    return NextResponse.json(buildPlusMoins(await levelPool(level), Date.now(), Math.random, level), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Animes indisponibles pour le moment (AniList ne répond pas)." }, { status: 503, headers: NO_STORE });
  }
}

// Une réponse { token, guess: "plus" | "moins" } ; à la première erreur, la série est enregistrée.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 90)) return NextResponse.json({ error: "Doucement ! Réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const key = openPlusMoins(body?.token);
  const guess = body?.guess === "plus" ? "plus" : body?.guess === "moins" ? "moins" : null;
  if (!key || !guess) return NextResponse.json({ error: "Partie expirée ou invalide : relance une partie." }, { status: 400, headers: NO_STORE });
  // Une partie terminée ne se rejoue pas avec un ancien jeton.
  if (await nonceUsed(key.nonce)) return NextResponse.json({ error: "Cette partie est terminée : relance-en une." }, { status: 409, headers: NO_STORE });
  const step = stepPlusMoins(key, guess, await (key.level ? levelPool(key.level) : getAnimePool()).catch(() => []));
  if (!step) return NextResponse.json({ error: "Partie invalide : relance-en une." }, { status: 400, headers: NO_STORE });
  let saved = false;
  if (step.over) {
    const player = await parsePlayer(body);
    if (typeof player !== "string") saved = await recordPlay({ game: "plus-moins", ...player, score: pmPoints(step.streak, key.level), max_score: pmPoints(key.seq.length - 1, key.level), detail: { streak: step.streak, level: key.level ?? "normal" }, nonce: key.nonce }).catch(() => false);
  }
  return NextResponse.json({ ok: step.ok, score: step.score, base: step.base, streak: step.streak, points: pmPoints(step.streak, key.level), over: step.over, token: step.token, saved }, { headers: NO_STORE });
}
