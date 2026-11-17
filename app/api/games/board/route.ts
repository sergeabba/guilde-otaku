import { NextRequest, NextResponse } from "next/server";
import { DEVICE } from "../../../../lib/games/player";
import { history, isGame, leaderboard } from "../../../../lib/games/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Classement d'un jeu et, si ?device= est donné, l'historique de ce joueur.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = sp.get("game");
  const game = isGame(g) ? g : "quiz-generique";
  const device = sp.get("device") ?? "";
  const member = Number(sp.get("member"));
  const [board, mine] = await Promise.all([
    leaderboard(game),
    DEVICE.test(device) ? history(device, Number.isInteger(member) && member > 0 ? member : null) : Promise.resolve([]),
  ]);
  return NextResponse.json({ ...board, history: mine }, { headers: NO_STORE });
}
