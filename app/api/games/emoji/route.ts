import { NextRequest, NextResponse } from "next/server";
import { allPuzzles, buildEmoji, checkPuzzle, EMOJI_ROUNDS, openEmoji, scoreEmoji, type EmojiAnswer } from "../../../../lib/games/emoji";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { addEmoji, recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

// Nouvelle partie : 8 énigmes en émojis, 4 titres chacune ; le corrigé reste dans le jeton.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de parties d'un coup, réessaie dans une minute.", 429);
  return NextResponse.json(buildEmoji(await allPuzzles()), { headers: NO_STORE });
}

// { action: "finish", token, answers } : correction et enregistrement.
// { action: "propose", emojis, answer, hint } : énigme proposée, en attente de validation par l'admin.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de requêtes, réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  if (body?.action === "propose") {
    const p = checkPuzzle(body);
    if (typeof p === "string") return fail(p);
    const err = await addEmoji({ ...p, status: "pending", member_id: player.member_id, player_name: player.player_name });
    return err ? fail(err, 503) : NextResponse.json({ saved: true }, { headers: NO_STORE });
  }
  const key = openEmoji(body?.token);
  if (!key) return fail("Partie expirée ou invalide : relance une partie.");
  const answers: EmojiAnswer[] = Array.isArray(body?.answers) ? body.answers.slice(0, EMOJI_ROUNDS).map((a: { choice?: unknown; ms?: unknown; hint?: unknown }) => ({ choice: typeof a?.choice === "number" ? a.choice : null, ms: Number(a?.ms), hint: a?.hint === true })) : [];
  const result = scoreEmoji(key, answers, await allPuzzles());
  let saved = false;
  try {
    saved = await recordPlay({ game: "emoji-quiz", ...player, score: result.score, max_score: result.max, detail: { good: result.good, rounds: key.ids.length }, nonce: key.nonce });
  } catch (e) { return fail(e instanceof Error ? e.message : "Partie non enregistrée.", 409); }
  return NextResponse.json({ ...result, saved }, { headers: NO_STORE });
}
