// Vidéos de la Guilde : lues dans un dossier Google Drive partagé « tous les
// utilisateurs disposant du lien » (clé d'API Google, lecture seule). Chaque
// sous-dossier est une collection. Les vidéos restent sur le Drive : le site ne
// stocke ni ne sert aucun fichier vidéo. Module serveur.
import { unstable_cache } from "next/cache";

export const DRIVE_TAG = "drive-videos";
const API = "https://www.googleapis.com/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";

export interface GuildVideo {
  id: string;
  title: string;
  description: string | null;
  thumb: string | null;
  durationMs: number | null;
  createdAt: string | null;
  collection: string;
}
export interface GuildCollection { name: string; videos: GuildVideo[] }

interface RawFile {
  id: string; name: string; mimeType: string; description?: string; thumbnailLink?: string; createdTime?: string;
  videoMediaMetadata?: { durationMillis?: string };
}

/**
 * Identifiant du dossier à partir du lien de partage complet
 * (« https://drive.google.com/drive/folders/1AbC…?usp=sharing ») ou de l'identifiant seul.
 */
export function parseFolderId(raw?: string | null): string | null {
  const s = raw?.trim();
  if (!s) return null;
  const m = s.match(/\/folders\/([\w-]{10,100})/) ?? s.match(/[?&]id=([\w-]{10,100})/);
  const id = m ? m[1] : s;
  return /^[\w-]{10,100}$/.test(id) ? id : null;
}

/** Dossier du Cinéma (variable GOOGLE_DRIVE_FOLDER_ID : lien ou identifiant). */
export function driveFolder(): string | null {
  return parseFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID);
}

/** Configuration complète (clé d'API + dossier) : liste détaillée des vidéos. */
export function driveConfig(): { key: string; folder: string } | null {
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  const folder = driveFolder();
  return key && folder ? { key, folder } : null;
}

async function list(parent: string, key: string): Promise<RawFile[]> {
  const out: RawFile[] = [];
  let pageToken = "";
  do {
    const q = encodeURIComponent(`'${parent}' in parents and trashed = false`);
    const fields = encodeURIComponent("nextPageToken, files(id,name,mimeType,description,thumbnailLink,createdTime,videoMediaMetadata(durationMillis))");
    const res = await fetch(`${API}?q=${q}&fields=${fields}&orderBy=createdTime desc&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ""}`, {
      headers: { "X-Goog-Api-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 403 || res.status === 400) throw new Error("Google Drive refuse l'accès : vérifie la clé (API Drive activée) et que le dossier est partagé avec « tous les utilisateurs disposant du lien ».");
    if (res.status === 404) throw new Error("Dossier Google Drive introuvable : vérifie GOOGLE_DRIVE_FOLDER_ID.");
    if (!res.ok) throw new Error(`Google Drive indisponible (${res.status}).`);
    const data = await res.json();
    out.push(...(data.files ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken && out.length < 1000);
  return out;
}

/** « 2024-12-24_Soirée quiz.mp4 » → « Soirée quiz » (extension, date et tirets retirés). */
export function cleanTitle(name: string): string {
  return name
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[\s_-]*/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || name;
}

/** Miniature plus grande (le lien Drive se termine par « =s220 »). */
export const bigThumb = (link?: string) => (link ? link.replace(/=s\d+(-[a-z])?$/, "=w640") : null);

export function toVideo(f: RawFile, collection: string): GuildVideo {
  const ms = Number(f.videoMediaMetadata?.durationMillis);
  return {
    id: f.id, title: cleanTitle(f.name), description: f.description?.trim() || null,
    thumb: bigThumb(f.thumbnailLink), durationMs: Number.isFinite(ms) && ms > 0 ? ms : null,
    createdAt: f.createdTime ?? null, collection,
  };
}

// ── Sans clé d'API : lecture de la vue publique du dossier partagé ─────────────
// Drive publie pour tout dossier partagé « avec le lien » une page de liste simple
// (embeddedfolderview) : identifiants, noms et type de chaque élément. On la lit
// côté serveur pour afficher les vidéos dans le style du site et les lire sur place.

export interface PublicEntry { id: string; name: string; kind: "folder" | "video" | "other" }

const decodeHtml = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (m, e: string) => {
  if (e[0] === "#") { const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[e.toLowerCase()] ?? m;
});

/** Éléments de la vue publique d'un dossier Drive (HTML de embeddedfolderview). */
export function parseEmbeddedFolder(html: string): PublicEntry[] {
  const out: PublicEntry[] = [];
  for (const block of html.split('<div class="flip-entry" ').slice(1)) {
    const id = /^id="entry-([\w-]{10,100})"/.exec(block)?.[1];
    const name = decodeHtml(/<div class="flip-entry-title">([^<]*)<\/div>/.exec(block)?.[1] ?? "").trim();
    if (!id || !name) continue;
    const href = /<a href="([^"]+)"/.exec(block)?.[1] ?? "";
    const kind = /\/folders\//.test(href) || /vnd\.google-apps\.folder/.test(block) ? "folder"
      : /\/type\/video\//.test(block) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(name) ? "video" : "other";
    out.push({ id, name, kind });
  }
  return out;
}

async function listPublic(folder: string): Promise<PublicEntry[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folder)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GuildeOtaku/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404) throw new Error("Dossier Google Drive introuvable : vérifie le lien dans GOOGLE_DRIVE_FOLDER_ID.");
  if (!res.ok) throw new Error(`Google Drive indisponible (${res.status}).`);
  const html = await res.text();
  if (!html.includes("flip-entries")) throw new Error("Dossier Google Drive illisible : vérifie qu'il est partagé avec « tous les utilisateurs disposant du lien ».");
  return parseEmbeddedFolder(html);
}

/** Vignette d'une vidéo partagée (adresse stable, largeur au choix). */
export const publicThumb = (id: string, w = 1280) => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w${w}`;

const publicVideo = (e: PublicEntry, collection: string): GuildVideo => ({
  id: e.id, title: cleanTitle(e.name), description: null, thumb: publicThumb(e.id), durationMs: null, createdAt: null, collection,
});

const ROOT_COLLECTION = "Les vidéos de la Guilde";

/**
 * Collections (sous-dossiers) et vidéos. Avec GOOGLE_DRIVE_API_KEY : API officielle
 * (durées, descriptions, dates). Sans clé : vue publique du dossier partagé.
 * Mis en cache 10 min (bouton « Rafraîchir » dans l'admin).
 */
export const getGuildVideos = unstable_cache(async (): Promise<GuildCollection[]> => {
  const folder = driveFolder();
  if (!folder) return [];
  const cfg = driveConfig();
  const collections: GuildCollection[] = [];
  if (cfg) {
    const root = await list(cfg.folder, cfg.key);
    const isVideo = (f: RawFile) => f.mimeType.startsWith("video/");
    const loose = root.filter(isVideo).map((f) => toVideo(f, ROOT_COLLECTION));
    if (loose.length) collections.push({ name: ROOT_COLLECTION, videos: loose });
    for (const sub of root.filter((f) => f.mimeType === FOLDER).sort((a, b) => a.name.localeCompare(b.name, "fr"))) {
      const videos = (await list(sub.id, cfg.key)).filter(isVideo).map((f) => toVideo(f, sub.name.trim()));
      if (videos.length) collections.push({ name: sub.name.trim(), videos });
    }
    return collections;
  }
  const root = await listPublic(folder);
  const loose = root.filter((e) => e.kind === "video").map((e) => publicVideo(e, ROOT_COLLECTION));
  if (loose.length) collections.push({ name: ROOT_COLLECTION, videos: loose });
  for (const sub of root.filter((e) => e.kind === "folder").slice(0, 20).sort((a, b) => a.name.localeCompare(b.name, "fr"))) {
    const videos = (await listPublic(sub.id).catch(() => [])).filter((e) => e.kind === "video").map((e) => publicVideo(e, sub.name));
    if (videos.length) collections.push({ name: sub.name, videos });
  }
  return collections;
}, ["guild-drive-v2"], { revalidate: 600, tags: [DRIVE_TAG] });

/** Lecteur intégré de Google Drive pour une vidéo partagée. */
export const drivePlayer = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
