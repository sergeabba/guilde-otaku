import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/auth";
import { parseAdminDbRequest } from "../../../../lib/admin-db";

const NO_STORE = { "Cache-Control": "no-store" };

// Écritures admin (fighters, bibliotheque, bons_plans) avec la clé serveur.
// Accès réservé à une session admin valide, depuis ce site uniquement.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Base non configurée sur le serveur (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503, headers: NO_STORE });
  }

  const parsed = parseAdminDbRequest(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE });

  const db = createClient(url, key, { auth: { persistSession: false } }).from(parsed.table);
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
  return NextResponse.json({ data }, { headers: NO_STORE });
}
