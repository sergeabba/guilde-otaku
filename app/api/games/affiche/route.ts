import { NextRequest, NextResponse } from "next/server";
import { buildAffiche, openAffiche, scoreAffiche, AFFICHE_ROUNDS } from "../../../../lib/games/arcade";
import { getAnimePool, levelPool } from "../../../../lib/games/pool";
import { parseLevel } from "../../../../lib/games/levels";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const busy = () => NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });

// L'Affiche en morceaux : 8 affiches, 4 titres chacune ; le corrigé reste dans le jeton.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return busy();
  try {
    const level = parseLevel(req.nextUrl.searchParams.get("level"));
    return NextResponse.json(buildAffiche(await levelPool(level), Date.now(), Math.random, level), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Affiches indisponibles pour le moment (AniList ne répond pas)." }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return busy();
  const body = await req.json().catch(() => null);
  const key = openAffiche(body?.token);
  if (!key) return NextResponse.json({ error: "Partie expirée ou invalide : relance une partie." }, { status: 400, headers: NO_STORE });
  const player = await parsePlayer(body);
  if (typeof player === "string") return NextResponse.json({ error: player }, { status: 400, headers: NO_STORE });
  const answers = Array.isArray(body?.answers) ? body.answers.slice(0, AFFICHE_ROUNDS).map((a: { choice?: unknown; ms?: unknown }) => ({ choice: typeof a?.choice === "number" ? a.choice : null, ms: Number(a?.ms) })) : [];
  const result = scoreAffiche(key, answers, await (key.level ? levelPool(key.level) : getAnimePool()).catch(() => []));
  let saved = false;
  try {
    saved = await recordPlay({ game: "affiche", ...player, score: result.score, max_score: result.max, detail: { good: result.good, rounds: key.ids.length, level: key.level ?? "normal" }, nonce: key.nonce });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Partie non enregistrée." }, { status: 409, headers: NO_STORE });
  }
  return NextResponse.json({ ...result, saved }, { headers: NO_STORE });
}
