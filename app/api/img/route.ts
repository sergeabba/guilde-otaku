import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { THUMB_WIDTHS, storagePathOk } from "../../../lib/image-loader";

// Vignettes des images du stockage public de la Guilde (portraits envoyés par l'admin).
// Supabase ne redimensionne pas sur cette offre et l'optimiseur de Vercel a un quota :
// on réduit ici une fois, en WebP, puis le CDN garde le résultat. Seuls les fichiers
// du seau public guilde-images et des largeurs fixes sont acceptés.
// Une image remplacée dans l'admin (même nom) est servie à jour au plus tard le lendemain.
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p") ?? "";
  const w = Number(req.nextUrl.searchParams.get("w"));
  if (!BASE || !storagePathOk(p) || !(THUMB_WIDTHS as readonly number[]).includes(w)) {
    return NextResponse.json({ error: "Image invalide" }, { status: 400 });
  }
  try {
    const res = await fetch(`${BASE}/storage/v1/object/public/${p.split("/").map(encodeURIComponent).join("/")}`);
    const type = res.headers.get("content-type") ?? "";
    const size = Number(res.headers.get("content-length") ?? 0);
    if (!res.ok || !type.startsWith("image/") || size > MAX_BYTES) return NextResponse.json({ error: "Image indisponible" }, { status: 502 });
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde" }, { status: 413 });
    const out = await sharp(input, { limitInputPixels: 40e6 }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 4 }).toBuffer();
    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image indisponible" }, { status: 502 });
  }
}
