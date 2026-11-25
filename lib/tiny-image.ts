// Miniature floue d'une image (24 px de large, environ 1 Ko, en data URI) pour les grands
// fonds « flous » : le navigateur l'agrandit, ce qui donne le flou sans filtre CSS coûteux
// au défilement. Module serveur ; résultat mis en cache une journée par image.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import sharp from "sharp";

const REMOTE_OK = /^https:\/\/([\w-]+\.supabase\.(co|in)\/storage\/v1\/object\/public\/|image\.tmdb\.org\/|s4\.anilist\.co\/|uploads\.mangadex\.org\/)/;

async function load(src: string): Promise<Buffer | null> {
  if (src.startsWith("/")) {
    const path = decodeURIComponent(src.split(/[?#]/)[0]);
    if (path.includes("..")) return null;
    return readFile(join(process.cwd(), "public", path)).catch(() => null);
  }
  if (!REMOTE_OK.test(src)) return null;
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 15_000_000 ? null : buf;
  } catch { return null; }
}

async function make(src: string): Promise<string | null> {
  const buf = await load(src);
  if (!buf) return null;
  try {
    const out = await sharp(buf).resize({ width: 24, withoutEnlargement: true }).webp({ quality: 60 }).toBuffer();
    return `data:image/webp;base64,${out.toString("base64")}`;
  } catch { return null; }
}

/** Miniature floue de l'image, ou null si elle est introuvable. */
export const tinyImage = (src: string | null | undefined): Promise<string | null> =>
  src ? unstable_cache(() => make(src), ["tiny-image-v1", src], { revalidate: 86_400 })() : Promise.resolve(null);
