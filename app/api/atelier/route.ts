import { readdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export async function GET() {
  try {
    const dir = join(process.cwd(), "public", "atelier");
    const files = await readdir(dir);
    
    const images = files
      .filter(f => IMAGE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
      .map(f => ({
        filename: f,
        url: `/atelier/${f}`,
        // Génère un titre lisible depuis le nom de fichier
        title: f
          .replace(/\.[^.]+$/, "") // retire l'extension
          .replace(/[-_]/g, " ")   // tirets/underscores → espaces
          .replace(/\b\w/g, c => c.toUpperCase()), // Title Case
      }));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}