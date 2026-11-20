import { NextRequest, NextResponse } from "next/server";
import { castFilmVote, currentPoll, pollBySlug, results } from "../../../lib/film-polls";
import { isOpen } from "../../../lib/film-poll-logic";
import { VOTER } from "../../../lib/bash-votes";
import { getPublicMembers } from "../../../lib/members-server";
import { ipOf, limited } from "../../../lib/games/player";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

// Sondage (?slug=…, sinon celui de l'accueil) et résultats en direct ; ?voter= : le vote de cet appareil.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get("slug");
  const voter = sp.get("voter");
  try {
    const poll = slug ? await pollBySlug(slug.slice(0, 60)) : await currentPoll();
    if (!poll) return NextResponse.json({ poll: null }, { headers: NO_STORE });
    const r = await results(poll, voter && VOTER.test(voter) ? voter : null);
    return NextResponse.json({ poll, open: isOpen(poll), now: Date.now(), ...r }, { headers: NO_STORE });
  } catch {
    return fail("Vote indisponible pour le moment.", 502);
  }
}

// Vote : { slug, voter, choice: numéro TMDB du film | null (retrait), memberId? }.
export async function POST(req: NextRequest) {
  if (limited(ipOf(req.headers), 30)) return fail("Trop de votes d'un coup, réessaie dans une minute.", 429);
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.slice(0, 60) : "";
  const voter = typeof body?.voter === "string" ? body.voter : "";
  if (!VOTER.test(voter)) return fail("Identifiant de vote invalide.");
  let poll;
  try { poll = await pollBySlug(String(slug).slice(0, 60)); } catch { return fail("Vote indisponible pour le moment.", 502); }
  if (!poll) return fail("Ce vote n'existe pas.", 404);
  if (!isOpen(poll)) return fail(Date.now() < Date.parse(poll.starts_at) ? "Ce vote n'a pas encore commencé." : "Ce vote est terminé.", 409);
  const choice = body?.choice === null ? null : Number(body?.choice);
  if (choice !== null && !poll.films.some((f) => f.tmdb === choice)) return fail("Film inconnu dans ce vote.");
  let memberId: number | null = null;
  if (body?.memberId != null) {
    const id = Number(body.memberId);
    const members = await getPublicMembers().catch(() => []);
    if (!Number.isInteger(id) || !members.some((m) => m.id === id)) return fail("Membre inconnu.");
    memberId = id;
  }
  try {
    await castFilmVote(poll, voter, choice, memberId);
    return NextResponse.json({ ok: true, poll, open: true, now: Date.now(), ...(await results(poll, voter)) }, { headers: NO_STORE });
  } catch {
    return fail("Vote non enregistré, réessaie.", 502);
  }
}
