import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { filmCard, listPolls, POLLS_MISSING, results, searchFilms } from "../../../../lib/film-polls";
import { MAX_HOURS, pollSlug } from "../../../../lib/film-poll-logic";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });

// Liste des votes avec leurs résultats ; ?q= : recherche de films sur TMDB.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const q = req.nextUrl.searchParams.get("q")?.trim();
  try {
    if (q) return NextResponse.json({ results: await searchFilms(q.slice(0, 100)) }, { headers: NO_STORE });
    const { available, polls } = await listPolls(40);
    const withResults = await Promise.all(polls.map(async (p) => ({ ...p, tally: (await results(p)).tally })));
    return NextResponse.json({ available, polls: withResults, ...(available ? {} : { error: POLLS_MISSING }) }, { headers: NO_STORE });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erreur", 502);
  }
}

// Création : { title, films: [numéros TMDB], hours, startsAt? } ; les fiches sont lues sur TMDB ici.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 120) : "";
  const ids = Array.isArray(body?.films) ? [...new Set((body.films as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n > 0))] : [];
  const hours = Number(body?.hours);
  if (!title) return fail("Donne un titre au vote.");
  if (ids.length < 2 || ids.length > 8) return fail("Choisis entre 2 et 8 films.");
  if (!Number.isFinite(hours) || hours < 1 || hours > MAX_HOURS) return fail("Durée invalide (1 heure à 14 jours).");
  const start = body?.startsAt ? Date.parse(body.startsAt) : Date.now();
  if (!Number.isFinite(start)) return fail("Date de début invalide.");
  let films;
  try { films = await Promise.all(ids.map((id) => filmCard(id))); } catch (e) { return fail(e instanceof Error ? e.message : "TMDB indisponible.", 502); }
  const row = { title, films, starts_at: new Date(start).toISOString(), ends_at: new Date(start + hours * 3_600_000).toISOString() };
  // Adresse lisible ; un suffixe si elle est déjà prise.
  for (let k = 0; k < 4; k++) {
    const slug = pollSlug(title, new Date(start), k ? Math.random().toString(36).slice(2, 6) : "");
    const { data, error } = await db.from("film_polls").insert({ ...row, slug }).select("*");
    if (!error) return NextResponse.json({ poll: (data ?? [])[0] }, { headers: NO_STORE });
    if (!/duplicate key/i.test(error.message)) return fail(/film_polls/.test(error.message) && /exist|schema cache/i.test(error.message) ? POLLS_MISSING : error.message, 500);
  }
  return fail("Adresse du vote déjà prise, change le titre.", 409);
}

// { id, action: "close" } termine le vote maintenant ; { id, action: "extend", hours } le prolonge.
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id)) return fail("Vote inconnu.");
  const { data, error } = await db.from("film_polls").select("*").eq("id", id).limit(1);
  const poll = (data ?? [])[0] as { starts_at: string; ends_at: string } | undefined;
  if (error || !poll) return fail("Vote inconnu.", 404);
  let ends: number;
  if (body?.action === "close") ends = Math.max(Date.now(), Date.parse(poll.starts_at) + 60_000);
  else if (body?.action === "extend") {
    const h = Number(body?.hours);
    if (!Number.isFinite(h) || h < 1 || h > MAX_HOURS) return fail("Durée invalide.");
    ends = Math.max(Date.now(), Date.parse(poll.ends_at)) + h * 3_600_000;
  } else return fail("Action inconnue.");
  const { error: e2 } = await db.from("film_polls").update({ ends_at: new Date(ends).toISOString() }).eq("id", id);
  return e2 ? fail(e2.message, 500) : NextResponse.json({ saved: true }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const id = Number((await req.json().catch(() => null))?.id);
  if (!Number.isInteger(id)) return fail("Vote inconnu.");
  const { error } = await db.from("film_polls").delete().eq("id", id);
  return error ? fail(error.message, 500) : NextResponse.json({ deleted: true }, { headers: NO_STORE });
}
