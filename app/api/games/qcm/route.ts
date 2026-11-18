import { NextRequest, NextResponse } from "next/server";
import { catalogAnimes, catalogChars } from "../../../../lib/games/catalog";
import { parseLevel } from "../../../../lib/games/levels";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { ANIME_RANGE, buildCreateur, buildStudio, buildThemes, buildVoix, CHAR_RANGE, isQcmKind, openQcm, scoreQcm, type QcmAnswer } from "../../../../lib/games/qcm";
import { recordPlay } from "../../../../lib/games/store";
import { shuffle } from "../../../../lib/games/token";
import { voiceClip } from "../../../../lib/games/voice-clip";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

/** Extraits de voix pour une douzaine de persos tirés au hasard (doubleurs différents). */
async function clipsFor(chars: Awaited<ReturnType<typeof catalogChars>>) {
  const seen = new Set<string>(), pick: typeof chars = [];
  for (const c of shuffle(chars.filter((x) => x.voice && x.voiceNative))) {
    if (seen.has(c.voiceNative!)) continue;
    seen.add(c.voiceNative!); pick.push(c);
    if (pick.length >= 12) break;
  }
  const found = await Promise.all(pick.map(async (c) => [c.id, await voiceClip(c.voiceNative!, c.native ?? null)] as const));
  return new Map(found.filter((x): x is readonly [number, { url: string; inRole: boolean }] => !!x[1]));
}

// Jeux experts : ?kind=themes|createur|studio|voix&level=facile|normal|expert.
export async function GET(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de parties d'un coup, réessaie dans une minute.", 429);
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind"), level = parseLevel(sp.get("level"));
  if (!isQcmKind(kind)) return fail("Jeu inconnu.");
  try {
    if (kind === "voix") {
      const [lo, hi] = CHAR_RANGE[level];
      const chars = (await catalogChars(hi)).filter((c) => c.rank >= lo);
      return NextResponse.json(buildVoix(chars, level, Date.now(), Math.random, await clipsFor(chars)), { headers: NO_STORE });
    }
    const [lo, hi] = ANIME_RANGE[level];
    const animes = (await catalogAnimes(hi)).filter((a) => a.rank >= lo);
    const game = kind === "themes" ? buildThemes(animes, level) : kind === "createur" ? buildCreateur(animes, level) : buildStudio(animes, level);
    if (!game.rounds.length) return fail("Pas assez de données pour ce jeu en ce moment.", 503);
    return NextResponse.json(game, { headers: NO_STORE });
  } catch {
    return fail("Jeu indisponible pour le moment (AniList ne répond pas).", 503);
  }
}

// Fin de partie : correction et enregistrement (le jeu enregistré porte le nom du jeu expert).
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 20)) return fail("Trop de requêtes, réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const key = openQcm(body?.token);
  if (!key) return fail("Partie expirée ou invalide : relance une partie.");
  const player = await parsePlayer(body);
  if (typeof player === "string") return fail(player);
  const answers: QcmAnswer[] = Array.isArray(body?.answers) ? body.answers.slice(0, 10).map((a: { choice?: unknown; text?: unknown; ms?: unknown }) => ({ choice: typeof a?.choice === "number" ? a.choice : null, text: typeof a?.text === "string" ? a.text.slice(0, 120) : undefined, ms: Number(a?.ms) })) : [];
  const result = scoreQcm(key, answers);
  let saved = false;
  try {
    saved = await recordPlay({ game: key.kind, ...player, score: result.score, max_score: result.max, detail: { good: result.good, rounds: key.answers.length, level: key.level }, nonce: key.nonce });
  } catch (e) { return fail(e instanceof Error ? e.message : "Partie non enregistrée.", 409); }
  return NextResponse.json({ ...result, saved }, { headers: NO_STORE });
}
