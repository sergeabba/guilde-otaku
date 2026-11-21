import { NextRequest, NextResponse } from "next/server";
import { buildClips, openClips, scoreClips, type ClipAnswer } from "../../../../lib/games/clips";
import { parseLevel } from "../../../../lib/games/levels";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

// Blind test vidéo : nouvelle partie (?level=) ; le corrigé reste dans le jeton signé.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de parties d'un coup, réessaie dans une minute.", 429);
  return NextResponse.json(buildClips(parseLevel(req.nextUrl.searchParams.get("level"))), { headers: NO_STORE });
}

// Fin de partie : correction et enregistrement.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de requêtes, réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const key = openClips(body?.token);
  if (!key) return fail("Partie expirée ou invalide : relance une partie.");
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  const answers: ClipAnswer[] = Array.isArray(body?.answers) ? body.answers.slice(0, 10).map((a: { choice?: unknown; ms?: unknown }) => ({ choice: typeof a?.choice === "number" ? a.choice : null, ms: Number(a?.ms) })) : [];
  const result = scoreClips(key, answers);
  let saved = false;
  try {
    saved = await recordPlay({ game: "generiques", ...player, score: result.score, max_score: result.max, detail: { good: result.good, rounds: key.reveal.length, level: key.level }, nonce: key.nonce });
  } catch (e) { return fail(e instanceof Error ? e.message : "Partie non enregistrée.", 409); }
  return NextResponse.json({ ...result, saved }, { headers: NO_STORE });
}
