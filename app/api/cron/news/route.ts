import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getServiceClient } from "../../../../lib/supabase-admin";
import { syncNews } from "../../../../lib/news";

// Tâche planifiée Vercel (vercel.json → crons) : récupère les flux chaque jour et met
// les nouveaux articles EN ATTENTE. Rien n'est publié sans relecture dans l'admin.
// Vercel envoie « Authorization: Bearer <CRON_SECRET> » quand CRON_SECRET est défini.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok = !!secret && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: "Base non configurée" }, { status: 503 });
  const reports = await syncNews(db);
  return NextResponse.json({ reports });
}
