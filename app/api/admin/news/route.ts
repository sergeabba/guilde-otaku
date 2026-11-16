import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "../../../../lib/auth";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";
import { NEWS_FEEDS, syncNews, type NewsStatus } from "../../../../lib/news";

const NO_STORE = { "Cache-Control": "no-store" };
const STATUSES: NewsStatus[] = ["pending", "published", "rejected"];
const MISSING_TABLE = "La table news_items n'existe pas encore : lance la migration scripts/migrations/2026-11-16_news.sql dans Supabase.";
const tableMissing = (msg: string) => /news_(items|runs)/.test(msg) && /does not exist|schema cache|not find/i.test(msg);

// File de relecture : articles par statut + derniers passages de récupération.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const status = req.nextUrl.searchParams.get("status") as NewsStatus | null;
  const wanted = status && STATUSES.includes(status) ? status : "pending";
  const [items, runs, counts] = await Promise.all([
    db.from("news_items").select("*").eq("status", wanted).order("published_at", { ascending: false, nullsFirst: false }).limit(60),
    db.from("news_runs").select("*").order("started_at", { ascending: false }).limit(10),
    Promise.all(STATUSES.map((s) => db.from("news_items").select("id", { count: "exact", head: true }).eq("status", s))),
  ]);
  if (items.error) {
    const msg = items.error.message;
    return NextResponse.json({ error: tableMissing(msg) ? MISSING_TABLE : `Lecture impossible : ${msg}`, missingTable: tableMissing(msg) }, { status: tableMissing(msg) ? 424 : 502, headers: NO_STORE });
  }
  return NextResponse.json({
    status: wanted, items: items.data ?? [], runs: runs.data ?? [], feeds: NEWS_FEEDS,
    counts: Object.fromEntries(STATUSES.map((s, i) => [s, counts[i].count ?? 0])),
  }, { headers: NO_STORE });
}

// Récupérer maintenant les flux (nouveaux articles mis en attente, jamais publiés).
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const reports = await syncNews(db);
  const missing = reports.find((r) => r.error && tableMissing(r.error));
  if (missing) return NextResponse.json({ error: MISSING_TABLE, missingTable: true, reports }, { status: 424, headers: NO_STORE });
  return NextResponse.json({ reports }, { headers: NO_STORE });
}

// Relecture : publier, écarter ou remettre en attente ; corriger titre et extrait.
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });
  const body = await req.json().catch(() => null) as { id?: unknown; status?: unknown; edited_title?: unknown; edited_excerpt?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400, headers: NO_STORE });
  const patch: Record<string, unknown> = {};
  if (body?.status !== undefined) {
    if (!STATUSES.includes(body.status as NewsStatus)) return NextResponse.json({ error: "Statut invalide" }, { status: 400, headers: NO_STORE });
    patch.status = body.status;
    patch.reviewed_at = new Date().toISOString();
  }
  for (const [key, max] of [["edited_title", 300], ["edited_excerpt", 400]] as const) {
    const v = body?.[key];
    if (v === undefined) continue;
    if (v !== null && typeof v !== "string") return NextResponse.json({ error: `${key} invalide` }, { status: 400, headers: NO_STORE });
    const t = typeof v === "string" ? v.trim() : "";
    if (t.length > max) return NextResponse.json({ error: `Texte trop long (${max} caractères au plus)` }, { status: 400, headers: NO_STORE });
    patch[key] = t || null;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Rien à modifier" }, { status: 400, headers: NO_STORE });
  const { data, error } = await db.from("news_items").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: `Enregistrement refusé : ${error.message}` }, { status: 502, headers: NO_STORE });
  revalidateTag("news", { expire: 0 });
  return NextResponse.json({ item: data }, { headers: NO_STORE });
}
