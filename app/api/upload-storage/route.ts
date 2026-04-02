import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "guilde-images";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Variables d'environnement Supabase manquantes (SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  // Client avec service role key → bypass complet du RLS
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "fighters";
    const filename = formData.get("filename") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop lourd (max 5 Mo)" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté (jpg, png, webp uniquement)" },
        { status: 400 }
      );
    }

    // Construire le chemin dans le bucket
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const finalName = filename ? `${filename}.${ext}` : file.name;
    const storagePath = `${folder}/${finalName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload avec upsert (écrase si déjà existant)
    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-storage] Erreur Supabase:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({
      url: data.publicUrl,
      path: storagePath,
      filename: finalName,
    });
  } catch (err: any) {
    console.error("[upload-storage] Erreur inattendue:", err);
    return NextResponse.json({ error: err.message ?? "Erreur inconnue" }, { status: 500 });
  }
}