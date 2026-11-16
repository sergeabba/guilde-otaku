// Module serveur : images de l'Atelier pour l'accueil (mur défilant).
// Lecture du stockage Supabase (bucket « atelier ») et des titres de la table
// `atelier`, mise en cache et vidée à chaque envoi, modification ou suppression.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { atelierTitles } from "./atelier-title";
import { getPublicMembers } from "./members-server";

export const ATELIER_TAG = "atelier";
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;

export interface AtelierTile { src: string; title: string; accent: string; filename?: string; description?: string }

const safeAccent = (c: unknown) => (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : "#c9a84c");

async function fromStorage(): Promise<AtelierTile[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data: files, error } = await client.storage.from("atelier").list(undefined, { limit: 200 });
  if (error || !files) return [];
  const { data: meta } = await client.from("atelier").select("filename, title, accent, description");
  const byName = new Map((meta ?? []).map((m: { filename: string; title?: string; accent?: string; description?: string }) => [m.filename, m]));
  return files.filter((f) => IMAGE.test(f.name)).map((f) => {
    const m = byName.get(f.name);
    return { src: client.storage.from("atelier").getPublicUrl(f.name).data.publicUrl, title: m?.title || "", accent: safeAccent(m?.accent), filename: f.name, description: m?.description?.trim() || undefined };
  });
}

/** Repli : images livrées avec le site (public/atelier). */
async function fromPublic(): Promise<AtelierTile[]> {
  try {
    const names = await readdir(join(process.cwd(), "public/atelier"));
    return names.filter((n) => IMAGE.test(n) && n !== "teamotaku.png").map((n) => ({ src: `/atelier/${encodeURIComponent(n)}`, title: "", accent: "#c9a84c", filename: n }));
  } catch {
    return [];
  }
}

const cached = unstable_cache(async () => {
  const stored = await fromStorage().catch(() => []);
  const list = stored.length ? stored : await fromPublic();
  const names = atelierTitles(list.map((t) => ({ filename: t.filename ?? "", title: t.title })), (await getPublicMembers().catch(() => [])).map((m) => m.name));
  return list.map((t, i) => ({ ...t, title: names[i] }));
}, ["home-atelier-v3"], { revalidate: 600, tags: [ATELIER_TAG] });

/** Images de l'Atelier dans un ordre aléatoire (nouveau tirage à chaque visite). */
export async function getAtelierTiles(max = 36): Promise<AtelierTile[]> {
  const list = [...(await cached())];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, max);
}

/**
 * Une futilité précise, pour son aperçu de lien : image de la galerie (nom de fichier)
 * ou vidéo de la Guilde (« drive:<id> », vignette Google Drive). null si introuvable.
 */
export async function getAtelierWork(key: string): Promise<AtelierTile | null> {
  if (!key || key.length > 300) return null;
  if (key.startsWith("drive:")) {
    const { driveConfig, getGuildVideos } = await import("./drive");
    if (!driveConfig()) return null;
    const id = key.slice(6);
    const v = (await getGuildVideos().catch(() => [])).flatMap((c) => c.videos).find((x) => x.id === id);
    return v ? { src: v.thumb ?? "", title: v.title, accent: "#e8412c", filename: key, description: v.description ?? undefined } : null;
  }
  return (await cached()).find((t) => t.filename === key) ?? null;
}
