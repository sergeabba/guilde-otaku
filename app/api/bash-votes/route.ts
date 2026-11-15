import { NextRequest, NextResponse } from "next/server";
import { castVote, isKnownChronique, readPolls, VOTER, type BashChoice } from "../../../lib/bash-votes";
import { getPublicMembers } from "../../../lib/members-server";

const NO_STORE = { "Cache-Control": "no-store" };

// Limite simple par adresse : 30 votes par minute (instance serveur).
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

/** Résultats de tous les sondages (et si le sondage est disponible). */
export async function GET() {
  try {
    return NextResponse.json(await readPolls(), { headers: NO_STORE });
  } catch {
    return NextResponse.json({ available: false, polls: {} }, { status: 502, headers: NO_STORE });
  }
}

/** Vote : { chronique, voter, choice: "watch" | "skip" | null, memberId? }. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Trop de votes d'un coup, réessaie dans une minute." }, { status: 429, headers: NO_STORE });
  const body = await req.json().catch(() => null);
  const chronique = typeof body?.chronique === "string" ? body.chronique.slice(0, 160) : "";
  const voter = typeof body?.voter === "string" ? body.voter : "";
  const choice: BashChoice | null = body?.choice === "watch" || body?.choice === "skip" ? body.choice : null;
  if (!isKnownChronique(chronique)) return NextResponse.json({ error: "Chronique inconnue." }, { status: 400, headers: NO_STORE });
  if (!VOTER.test(voter)) return NextResponse.json({ error: "Identifiant de vote invalide." }, { status: 400, headers: NO_STORE });
  if (body?.choice !== null && choice === null) return NextResponse.json({ error: "Choix invalide." }, { status: 400, headers: NO_STORE });
  let memberId: number | null = null;
  if (body?.memberId != null) {
    const id = Number(body.memberId);
    const members = await getPublicMembers().catch(() => []);
    if (!Number.isInteger(id) || !members.some((m) => m.id === id)) return NextResponse.json({ error: "Membre inconnu." }, { status: 400, headers: NO_STORE });
    memberId = id;
  }
  try {
    await castVote(chronique, voter, choice, memberId);
    return NextResponse.json({ ok: true, ...(await readPolls()) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Vote non enregistré, réessaie." }, { status: 502, headers: NO_STORE });
  }
}

