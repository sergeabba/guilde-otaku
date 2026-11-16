import { NextRequest, NextResponse } from "next/server";
import { getPublicMembers } from "../../../../lib/members-server";
import { duel } from "../../../../lib/games/duel";
import { ipOf, limited, parsePlayer } from "../../../../lib/games/player";
import { recordPlay } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Duel de goûts : { a, b } (identifiants de membres) ; calcul à partir des vrais favoris.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 40)) return NextResponse.json({ error: "Trop de duels d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const members = await getPublicMembers().catch(() => []);
  const A = members.find((m) => m.id === Number(body?.a)), B = members.find((m) => m.id === Number(body?.b));
  if (!A || !B || A.id === B.id) return NextResponse.json({ error: "Choisis deux membres différents." }, { status: 400, headers: NO_STORE });
  const result = duel({ id: A.id, name: A.name, extras: A.extras }, { id: B.id, name: B.name, extras: B.extras });
  if (!result) return NextResponse.json({ error: `${!A.extras?.favoriteAnime?.length && !A.extras?.favoriteManga?.length ? A.name : B.name} n'a pas encore de favoris : pas de duel possible.` }, { status: 422, headers: NO_STORE });
  const player = await parsePlayer(body);
  let saved = false;
  if (typeof player !== "string") {
    saved = await recordPlay({ game: "duel", ...player, score: result.score, max_score: 100, detail: { a: A.id, b: B.id, verdict: result.verdict } }).catch(() => false);
  }
  return NextResponse.json({ result, a: { id: A.id, name: A.name }, b: { id: B.id, name: B.name }, saved }, { headers: NO_STORE });
}
