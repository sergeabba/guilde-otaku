import { NextRequest, NextResponse } from "next/server";
import { getAnimeSong } from "../../../../lib/anime-song";
import { buildChallenge, buildQuiz, songsOfTags, QUIZ_ROUNDS, scoreQuiz, verifyKey, type QuizAnswer } from "../../../../lib/games/quiz";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { parseLevel } from "../../../../lib/games/levels";
import { getPlay, recordPlayId } from "../../../../lib/games/store";
import { getPublicMembers } from "../../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };
const previewOf = async (i: number) => (await getAnimeSong(i).catch(() => null))?.preview ?? null;

/** Qui a lancé un défi : membre, sinon pseudo, sinon « un invité ». */
async function challenger(id: number) {
  const play = await getPlay(id);
  if (!play || !play.game.startsWith("quiz-")) return null;
  const members = play.member_id ? await getPublicMembers().catch(() => []) : [];
  const name = members.find((m) => m.id === play.member_id)?.name ?? play.player_name ?? "Un invité";
  return { play, info: { id: play.id, name, score: play.score, max: play.max_score, good: Number(play.detail?.good) || 0 } };
}

// Nouvelle partie : 10 extraits et leurs propositions ; le corrigé reste dans le jeton signé.
// ?mode=nostalgie : génériques français. ?defi=<numéro> : mêmes manches qu'une partie jouée.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return NextResponse.json({ error: "Trop de parties d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const sp = req.nextUrl.searchParams;
  try {
    const defi = Number(sp.get("defi"));
    if (sp.has("defi")) {
      const c = Number.isInteger(defi) ? await challenger(defi) : null;
      const quiz = c ? await buildChallenge(c.play.detail, defi, previewOf) : null;
      if (!c || !quiz) return NextResponse.json({ error: "Ce défi n'existe plus ou ses extraits sont indisponibles." }, { status: 404, headers: NO_STORE });
      return NextResponse.json({ ...quiz, defi: c.info, mode: c.play.detail?.mode ?? "generique", level: c.play.detail?.level ?? "normal" }, { headers: NO_STORE });
    }
    const quiz = await buildQuiz(previewOf, Date.now(), sp.get("mode") === "nostalgie" ? "nostalgie" : "generique", parseLevel(sp.get("level")), songsOfTags((sp.get("recent") ?? "").split(",").filter(Boolean)));
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
  const mode = key.mode ?? "generique";
  let id: number | null = null;
  try {
    id = await recordPlayId({
      game: mode === "nostalgie" ? "quiz-nostalgie" : "quiz-generique", ...player, score: result.score, max_score: result.max,
      // Manches gardées pour pouvoir lancer un défi à un ami avec exactement les mêmes extraits.
      detail: { good: result.good, rounds: key.songs.length, songs: key.songs, choices: key.choices ?? null, mode, level: key.level ?? "normal", ...(key.starts ? { starts: key.starts } : {}), ...(key.defi ? { defi: key.defi } : {}) },
      nonce: key.nonce,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Partie non enregistrée." }, { status: 409, headers: NO_STORE });
  }
  const versus = key.defi ? (await challenger(key.defi))?.info ?? null : null;
  return NextResponse.json({ ...result, saved: id !== null, id, versus }, { headers: NO_STORE });
}
