import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { mergeExtras, parseAdminDbRequest } from "../../../../lib/admin-db";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";
import { revalidateMembers } from "../../../../lib/revalidate-members";

const NO_STORE = { "Cache-Control": "no-store" };

// Écritures admin (fighters, bibliotheque, bons_plans) avec la clé serveur.
// Accès réservé à une session admin valide, depuis ce site uniquement.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const client = getServiceClient();
  if (!client) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });

  const parsed = parseAdminDbRequest(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE });

  const db = client.from(parsed.table);
  if (parsed.op === "insert" && parsed.table === "fighters") {
    for (const row of parsed.rows) if ("extras" in row) row.extras = mergeExtras({}, row.extras as Record<string, unknown>);
  }

  // `extras` : on part de la valeur stockée pour ne jamais perdre une donnée que l'admin ne gère pas.
  if (parsed.op === "update" && parsed.table === "fighters" && "extras" in parsed.values) {
    const { data: current, error: readError } = await client.from("fighters").select("extras").eq("id", parsed.id).maybeSingle();
    if (readError) return NextResponse.json({ error: `Lecture préalable impossible : ${readError.message}` }, { status: 500, headers: NO_STORE });
    if (!current) return NextResponse.json({ error: "Ligne introuvable" }, { status: 404, headers: NO_STORE });
    parsed.values.extras = mergeExtras(current.extras, parsed.values.extras as Record<string, unknown>);
  }
  const { data, error } =
    parsed.op === "insert" ? await db.insert(parsed.rows).select("id")
    : parsed.op === "update" ? await db.update(parsed.values).eq("id", parsed.id).select("id")
    : await db.delete().eq("id", parsed.id).select("id");

  if (error) {
    console.error("[admin/db]", parsed.table, parsed.op, error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });
  }
  if (parsed.op !== "insert" && (!data || data.length === 0)) {
    return NextResponse.json({ error: "Ligne introuvable" }, { status: 404, headers: NO_STORE });
  }
  if (parsed.table === "fighters") revalidateMembers();
  return NextResponse.json({ data }, { headers: NO_STORE });
}
