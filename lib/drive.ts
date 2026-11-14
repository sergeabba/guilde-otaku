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

export function driveConfig(): { key: string; folder: string } | null {
  const key = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  return key && folder && /^[\w-]{10,100}$/.test(folder) ? { key, folder } : null;
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

/** Collections (sous-dossiers) et vidéos, les plus récentes d'abord. Mis en cache 10 min. */
export const getGuildVideos = unstable_cache(async (): Promise<GuildCollection[]> => {
  const cfg = driveConfig();
  if (!cfg) return [];
  const root = await list(cfg.folder, cfg.key);
  const isVideo = (f: RawFile) => f.mimeType.startsWith("video/");
  const collections: GuildCollection[] = [];
  const loose = root.filter(isVideo).map((f) => toVideo(f, "Les vidéos de la Guilde"));
  if (loose.length) collections.push({ name: "Les vidéos de la Guilde", videos: loose });
  for (const folder of root.filter((f) => f.mimeType === FOLDER).sort((a, b) => a.name.localeCompare(b.name, "fr"))) {
    const videos = (await list(folder.id, cfg.key)).filter(isVideo).map((f) => toVideo(f, folder.name.trim()));
    if (videos.length) collections.push({ name: folder.name.trim(), videos });
  }
  return collections;
}, ["guild-drive-v1"], { revalidate: 600, tags: [DRIVE_TAG] });

/** Lecteur intégré de Google Drive pour une vidéo partagée. */
export const drivePlayer = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
