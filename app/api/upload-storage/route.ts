import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin, sanitizeFolder, sanitizeFilename, validateMediaFile } from "../../../lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "guilde-images";

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Configuration manquante" },
      { status: 500 }
    );
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "fighters";
    const rawFilename = formData.get("filename") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const validation = await validateMediaFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const folder = sanitizeFolder(rawFolder);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const finalName = rawFilename ? `${sanitizeFilename(rawFilename)}.${ext}` : sanitizeFilename(file.name);
    const storagePath = `${folder}/${finalName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Erreur d'upload" }, { status: 500 });
    }

    const { data } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({
      url: data.publicUrl,
      path: storagePath,
      filename: finalName,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}