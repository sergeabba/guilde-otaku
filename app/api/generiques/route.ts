import { NextResponse } from "next/server";
import { parisDay } from "../../../lib/games/arcade";
import { dailyPair, GENERIQUES } from "../../../lib/generiques";

// Génériques de la page Cinéma : la liste complète et ceux du jour (heure de Paris).
export async function GET() {
  const date = parisDay();
  const { op, ed } = dailyPair(GENERIQUES, date);
  return NextResponse.json({ date, op, ed, list: GENERIQUES }, { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800" } });
}
