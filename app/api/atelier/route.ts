import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin, sanitizeFilename, validateImageFile } from "../../../lib/auth";
import { revalidateTag } from "next/cache";
import { ATELIER_TAG } from "../../../lib/atelier-server";
import { atelierTitles, titleFromFilename } from "../../../lib/atelier-title";
import { getPublicMembers } from "../../../lib/members-server";

const memberNames = () => getPublicMembers().then((l) => l.map((m) => m.name)).catch(() => [] as string[]);

// L'accueil affiche ces images : son cache est vidé à chaque écriture.
const refreshHome = () => { try { revalidateTag(ATELIER_TAG, { expire: 0 }); } catch { /* sans effet hors requête */ } };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "atelier";

export const config = {
  maxDuration: 60,
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const ALLOWED_PATCH_FIELDS = ["title", "description", "prompt", "category", "universe", "accent", "size"] as const;

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ images: [], db_status: "error", db_error: "Configuration manquante" });
  }

  const adminClient = getAdminClient();

  try {
    // List all files from Supabase Storage
    const { data: files, error: listError } = await adminClient.storage
      .from(BUCKET)
      .list();

    if (listError) {
      // Bucket may not exist yet
      return NextResponse.json({
        images: [],
        db_status: "warning",
        db_error: listError.message,
      });
    }

    // Get Supabase DB metadata
    let dbMeta: { filename: string; [key: string]: unknown }[] = [];
    try {
      const { data } = await adminClient.from("atelier").select("*");
      if (data) dbMeta = data;
    } catch {
      // Table may not exist — not fatal
    }

    const metaMap = new Map(dbMeta.map((m) => [m.filename, m]));

    const imageFiles = (files || []).filter((f: { name: string }) =>
      IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    const storageApi = adminClient.storage.from(BUCKET);

    const images = imageFiles.map((f: { name: string }) => {
      const meta = metaMap.get(f.name);
      const { data: urlData } = storageApi.getPublicUrl(f.name);
      return {
        id: meta?.id || null,
        filename: f.name,
        url: urlData?.publicUrl || `/atelier/${f.name}`,
        title:
          meta?.title ||
          f.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        description: meta?.description || "",
        prompt: meta?.prompt || "",
        category:
          meta?.category ||
          (f.name.toLowerCase().includes("portrait") ? "Portrait" : "Création"),
        universe: meta?.universe || "Guilde Otaku",
        accent: meta?.accent || "#8b5cf6",
        size: meta?.size || "cell-normal",
        has_db_record: !!meta,
      };
    });

    // Titres lisibles : titre saisi s'il est propre, sinon déduit du fichier, sinon « Création n°07 ».
    const names = atelierTitles(images.map((i) => ({ filename: i.filename, title: i.has_db_record ? (i.title as string) : null })), await memberNames());
    images.forEach((i, k) => { i.title = names[k]; });
    return NextResponse.json({ images, db_status: "connected", db_error: null });
  } catch {
    return NextResponse.json(
      { images: [], db_status: "error", db_error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile) files.push(singleFile);
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const results: { filename: string; url: string; success: boolean; error?: string }[] = [];

    for (const file of files) {
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        results.push({ filename: file.name, url: "", success: false, error: validation.error });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let finalName = sanitizeFilename(file.name).replace(/_+/g, "_");
      const put = (name: string) => adminClient.storage.from(BUCKET).upload(name, buffer, { contentType: file.type || "image/jpeg", upsert: true });

      let { error: uploadError } = await put(finalName);
      // Refus sur ce nom précis (fichier verrouillé, nom refusé…) : nouvel essai sous un nom unique.
      if (uploadError) {
        const dot = finalName.lastIndexOf(".");
        const retry = `${(dot > 0 ? finalName.slice(0, dot) : finalName).slice(0, 80)}-${Date.now().toString(36)}${dot > 0 ? finalName.slice(dot) : ".jpg"}`;
        const second = await put(retry);
        if (!second.error) { finalName = retry; uploadError = null; }
        else uploadError = second.error;
      }

      if (uploadError) {
        // Raison exacte du stockage (taille, format, droits…) au lieu d'un message générique.
        console.error("[atelier upload]", finalName, uploadError.message);
        results.push({ filename: finalName, url: "", success: false, error: `stockage : ${uploadError.message}` });
        continue;
      }

      // Nom lisible dès l'envoi (vide si le fichier n'en donne pas : l'affichage numérote).
      const title = titleFromFilename(finalName, await memberNames()) ?? "";

      await adminClient.from("atelier").upsert(
        {
          filename: finalName,
          title,
          category: finalName.toLowerCase().includes("portrait") ? "Portrait" : "Création",
        },
        { onConflict: "filename" }
      );

      const { data } = adminClient.storage.from(BUCKET).getPublicUrl(finalName);
      results.push({ filename: finalName, url: data.publicUrl, success: true });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount) refreshHome();
    return NextResponse.json({
      success: failCount === 0,
      results,
      summary: `${successCount} uploadé(s)${failCount > 0 ? `, ${failCount} échoué(s)` : ""}`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { filename } = body;
    if (!filename) {
      return NextResponse.json({ error: "Filename manquant" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { filename };
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("atelier")
      .upsert(updates, { onConflict: "filename" });
    if (error) throw error;

    refreshHome();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Nom de fichier manquant" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Delete from Supabase Storage
    await adminClient.storage.from(BUCKET).remove([filename]);

    // Delete from DB
    await adminClient.from("atelier").delete().eq("filename", filename);

    refreshHome();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
