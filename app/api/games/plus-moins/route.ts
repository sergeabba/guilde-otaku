import { NextRequest, NextResponse } from "next/server";
import { buildPlusMoins, openPlusMoins, stepPlusMoins } from "../../../../lib/games/arcade";
import { getAnimePool } from "../../../../lib/games/pool";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { nonceUsed, recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Plus ou moins : la note de chaque anime n'est révélée qu'après la réponse, par le serveur.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  try {
    return NextResponse.json(buildPlusMoins(await getAnimePool()), { headers: NO_STORE });
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
  const step = stepPlusMoins(key, guess, await getAnimePool().catch(() => []));
  if (!step) return NextResponse.json({ error: "Partie invalide : relance-en une." }, { status: 400, headers: NO_STORE });
  let saved = false;
  if (step.over) {
    const player = await parsePlayer(body);
    if (typeof player !== "string") saved = await recordPlay({ game: "plus-moins", ...player, score: step.streak, max_score: key.seq.length - 1, detail: { streak: step.streak }, nonce: key.nonce }).catch(() => false);
  }
  return NextResponse.json({ ok: step.ok, score: step.score, streak: step.streak, over: step.over, token: step.token, saved }, { headers: NO_STORE });
}
