import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_PASSWORD } from "../../../lib/constants";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "atelier";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ images: [], db_status: "error", db_error: "Supabase env vars missing" });
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

    return NextResponse.json({ images, db_status: "connected", db_error: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { images: [], db_status: "error", db_error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const finalName = file.name;

    const adminClient = getAdminClient();

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(finalName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Upsert DB metadata
    const title = finalName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    await adminClient.from("atelier").upsert(
      {
        filename: finalName,
        title,
        category: finalName.toLowerCase().includes("portrait") ? "Portrait" : "Création",
      },
      { onConflict: "filename" }
    );

    const { data } = adminClient.storage.from(BUCKET).getPublicUrl(finalName);

    return NextResponse.json({
      success: true,
      filename: finalName,
      url: data.publicUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
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
    const { filename, ...data } = body;
    if (!filename) {
      return NextResponse.json({ error: "Filename manquant" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("atelier")
      .upsert({ filename, ...data }, { onConflict: "filename" });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
