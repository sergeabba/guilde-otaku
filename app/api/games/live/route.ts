import { NextRequest, NextResponse } from "next/server";
import { getAnimeSong } from "../../../../lib/anime-song";
import { verifyKey } from "../../../../lib/games/quiz";
import { ipOf, limited } from "../../../../lib/games/player";

const NO_STORE = { "Cache-Control": "no-store" };

// Partie en direct : l'hôte demande le corrigé d'UNE manche, une fois la manche terminée.
// Les manches viennent de /api/games/quiz (jeton signé) ; les réponses ne quittent le
// serveur qu'une à une. Rien n'est enregistré en base.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 90)) return NextResponse.json({ error: "Trop de requêtes, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const key = typeof body?.token === "string" ? verifyKey(body.token) : null;
  const round = Number(body?.round);
  if (!key || !Number.isInteger(round) || round < 0 || round >= key.songs.length) return NextResponse.json({ error: "Partie expirée : relance une salle." }, { status: 400, headers: NO_STORE });
  const i = key.songs[round];
  const song = await getAnimeSong(i).catch(() => null);
  return NextResponse.json({ correct: key.answers[round], anime: song?.anime ?? key.choices?.[round]?.[key.answers[round]] ?? "", title: song?.title ?? "", artist: song?.artist ?? "", kind: song?.kind ?? "OP", cover: song?.cover ?? null }, { headers: NO_STORE });
}
