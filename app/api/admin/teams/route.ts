import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../lib/auth";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";
import { getPublicMembers } from "../../../../lib/members-server";
import { listTeams, missingTeamsTable, TEAMS_MISSING } from "../../../../lib/teams";
import { teamSlug, validateTeam } from "../../../../lib/teams-logic";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: NO_STORE });
const dbError = (e: { code?: string; message?: string }) => fail(missingTeamsTable(e) ? TEAMS_MISSING : e.message ?? "Erreur", 500);
const knownIds = async () => new Set((await getPublicMembers()).map((m) => m.id));

// Liste de toutes les équipes, publiées ou non.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  try {
    const { available, teams } = await listTeams(false);
    return NextResponse.json({ available, teams, ...(available ? {} : { error: TEAMS_MISSING }) }, { headers: NO_STORE });
  } catch (e) { return fail(e instanceof Error ? e.message : "Erreur", 502); }
}

// Création : { name, sport, formation, color?, motto?, slots, position?, published? }.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const v = validateTeam((await req.json().catch(() => null)) ?? {}, await knownIds());
  if ("error" in v) return fail(v.error);
  for (let k = 0; k < 4; k++) {
    const slug = teamSlug(v.row.name, k ? Math.random().toString(36).slice(2, 6) : "");
    const { data, error } = await db.from("guild_teams").insert({ ...v.row, slug }).select("*");
    if (!error) { revalidatePath("/teams"); return NextResponse.json({ team: (data ?? [])[0] }, { headers: NO_STORE }); }
    if (!/duplicate key/i.test(error.message)) return dbError(error);
  }
  return fail("Nom déjà pris, change-le.", 409);
}

// Modification : { id, ...mêmes champs }.
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const body = (await req.json().catch(() => null)) ?? {};
  const id = Number(body.id);
  if (!Number.isInteger(id)) return fail("Équipe inconnue.");
  const v = validateTeam(body, await knownIds());
  if ("error" in v) return fail(v.error);
  const { data, error } = await db.from("guild_teams").update({ ...v.row, updated_at: new Date().toISOString() }).eq("id", id).select("*");
  if (error) return dbError(error);
  if (!data?.length) return fail("Équipe inconnue.", 404);
  revalidatePath("/teams");
  return NextResponse.json({ team: data[0] }, { headers: NO_STORE });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req); if (denied) return denied;
  const db = getServiceClient(); if (!db) return fail(SERVICE_KEY_MISSING, 503);
  const id = Number((await req.json().catch(() => null))?.id);
  if (!Number.isInteger(id)) return fail("Équipe inconnue.");
  const { error } = await db.from("guild_teams").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/teams");
  return NextResponse.json({ deleted: true }, { headers: NO_STORE });
}
