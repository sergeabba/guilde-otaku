import { readdir, writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const getAtelierDir = () => join(process.cwd(), "public", "atelier");

export async function GET() {
  try {
    const dir = getAtelierDir();
    await mkdir(dir, { recursive: true });
    const files = await readdir(dir);
    
    // Récupérer les métadonnées depuis Supabase
    const { data: dbMeta } = await supabase.from("atelier").select("*");
    const metaMap = new Map(dbMeta?.map((m: any) => [m.filename, m]));

    const images = files
      .filter(f => IMAGE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
      .map((f, index) => {
        const meta = metaMap.get(f);
        return {
          id: meta?.id || null,
          filename: f,
          url: `/atelier/${f}`,
          title: meta?.title || f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: meta?.description || "",
          prompt: meta?.prompt || "",
          category: meta?.category || (f.toLowerCase().includes("portrait") ? "Portrait" : "Création"),
          universe: meta?.universe || "Guilde Otaku",
          accent: meta?.accent || "#8b5cf6",
          size: meta?.size || "small",
          has_db_record: !!meta,
        };
      });

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("API GET Error:", err.message);
    return NextResponse.json({ images: [] });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = getAtelierDir();
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, file.name);
    
    await writeFile(filePath, buffer);

    // Initialiser en base de données
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    await supabase.from("atelier").upsert({ 
      filename: file.name, 
      title, 
      category: file.name.toLowerCase().includes("portrait") ? "Portrait" : "Création" 
    });

    return NextResponse.json({ success: true, filename: file.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { filename, ...data } = body;
    if (!filename) return NextResponse.json({ error: "Filename manquant" }, { status: 400 });

    const { error } = await supabase.from("atelier").upsert({ filename, ...data }, { onConflict: 'filename' });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { filename } = await req.json();
    if (!filename) return NextResponse.json({ error: "Nom de fichier manquant" }, { status: 400 });

    const dir = getAtelierDir();
    const filePath = join(dir, filename);
    
    // Supprimer fichier
    try { await unlink(filePath); } catch(e) { console.warn("File was already deleted or missing"); }
    
    // Supprimer en base
    await supabase.from("atelier").delete().eq("filename", filename);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}