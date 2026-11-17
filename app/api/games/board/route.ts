import { NextRequest, NextResponse } from "next/server";
import { DEVICE } from "../../../../lib/games/player";
import { history, isGame, playerKey, ranking } from "../../../../lib/games/store";
import { getPublicMembers } from "../../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };

// Classement complet d'un jeu (tous les joueurs, leurs parties, dernières parties) et,
// si ?device= est donné, l'historique de ce joueur et sa clé publique (pour le repérer).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = sp.get("game");
  const game = isGame(g) ? g : "quiz-generique";
  const device = sp.get("device") ?? "";
  const m = Number(sp.get("member"));
  const member = Number.isInteger(m) && m > 0 ? m : null;
  const ok = DEVICE.test(device);
  const [board, mine, members] = await Promise.all([ranking(game), ok ? history(device, member) : Promise.resolve([]), getPublicMembers().catch(() => [])]);
  // Nom et portrait résolus ici, à partir de la même base que les parties.
  const byId = new Map(members.map((x) => [x.id, x]));
  const players = board.players.map((r) => {
    const mm = r.member_id ? byId.get(r.member_id) : undefined;
    return { ...r, name: mm?.name ?? r.name, image: mm ? mm.animeChar || mm.photo || null : null };
  });
  const meKeys = ok ? [playerKey({ member_id: null, device }), ...(member ? [playerKey({ member_id: member, device })] : [])] : [];
  return NextResponse.json({ ...board, players, history: mine, meKeys }, { headers: NO_STORE });
}
