import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../../lib/supabase-admin";
import { planUpload, UPLOAD_BUCKET } from "../../../../lib/admin-upload";

const NO_STORE = { "Cache-Control": "no-store" };

// Délivre une adresse d'envoi signée (valable 2 h, un seul fichier) pour qu'un
// portrait parte directement du navigateur vers le stockage Supabase. Le fichier
// ne transite pas par Vercel, dont les requêtes sont limitées à 4,5 Mo.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const client = getServiceClient();
  if (!client) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503, headers: NO_STORE });

  const body = await req.json().catch(() => null);
  const plan = planUpload(body ?? {});
  if ("error" in plan) return NextResponse.json({ error: plan.error }, { status: 400, headers: NO_STORE });

  const bucket = client.storage.from(UPLOAD_BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(plan.path);
  if (error || !data) {
    console.error("[admin/upload-url]", error?.message);
    return NextResponse.json({ error: "Le stockage a refusé l'envoi. Réessaie." }, { status: 502, headers: NO_STORE });
  }
  const publicUrl = bucket.getPublicUrl(plan.path).data.publicUrl;
  return NextResponse.json({ path: data.path, signedUrl: data.signedUrl, publicUrl, field: plan.field }, { headers: NO_STORE });
}
