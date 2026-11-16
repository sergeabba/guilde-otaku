import { NextRequest, NextResponse } from "next/server";
import { getAnimeSong } from "../../../../lib/anime-song";
import { buildQuiz, QUIZ_ROUNDS, scoreQuiz, verifyKey, type QuizAnswer } from "../../../../lib/games/quiz";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Nouvelle partie : 10 extraits et leurs propositions ; le corrigé reste dans le jeton signé.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  try {
    const quiz = await buildQuiz(async (i) => (await getAnimeSong(i).catch(() => null))?.preview ?? null);
    return NextResponse.json(quiz, { headers: NO_STORE });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Quiz indisponible." }, { status: 503, headers: NO_STORE });
  }
}

// Fin de partie : le serveur corrige, compte les points et enregistre la partie.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const key = typeof body?.token === "string" ? verifyKey(body.token) : null;
  if (!key) return NextResponse.json({ error: "Partie expirée ou invalide : relance un quiz." }, { status: 400, headers: NO_STORE });
  const player = await parsePlayer(body);
  if (typeof player === "string") return NextResponse.json({ error: player }, { status: 400, headers: NO_STORE });
  const answers: QuizAnswer[] = Array.isArray(body?.answers) ? body.answers.slice(0, QUIZ_ROUNDS).map((a: { choice?: unknown; ms?: unknown }) => ({ choice: typeof a?.choice === "number" ? a.choice : null, ms: Number(a?.ms) })) : [];
  const covers = await Promise.all(key.songs.map((i) => getAnimeSong(i).then((s) => s?.cover ?? null).catch(() => null)));
  const result = scoreQuiz(key, answers, (i) => covers[key.songs.indexOf(i)] ?? null);
  let saved = false;
  try {
    saved = await recordPlay({ game: "quiz-generique", ...player, score: result.score, max_score: result.max, detail: { good: result.good, rounds: key.songs.length }, nonce: key.nonce });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Partie non enregistrée." }, { status: 409, headers: NO_STORE });
  }
  return NextResponse.json({ ...result, saved }, { headers: NO_STORE });
}
