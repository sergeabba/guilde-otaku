import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "photos";
  const filename = formData.get("filename") as string | null;

  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop lourd (max 5 Mo)" }, { status: 400 });

  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED.includes(ext)) return NextResponse.json({ error: "Format non supporté (jpg, png, webp)" }, { status: 400 });

  const finalName = filename ? `${filename}${ext}` : file.name;
  const dir = join(process.cwd(), "public", folder);

  await mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(dir, finalName), Buffer.from(bytes));

  return NextResponse.json({ url: `/${folder}/${finalName}`, filename: finalName });
}