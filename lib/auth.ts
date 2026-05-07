import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1111";

export function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\./,
  /^100\.6[4-9]\./,
  /^100\.(7[0-9]|[89]\d|1[0-2]\d)\./,
];

export function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

const ALLOWED_FOLDERS = ["fighters", "atelier", "bibliotheque", "avatars"];

export function sanitizeFolder(folder: string): string {
  const normalized = folder.replace(/^\/+|\/+$/g, "");
  const base = normalized.split("/")[0].split("\\")[0];
  if (!ALLOWED_FOLDERS.includes(base)) {
    return "fighters";
  }
  if (normalized.includes("..") || normalized.includes("\\") || normalized.includes("//")) {
    return base;
  }
  return normalized;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\./g, "")
    .replace(/[\\/]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const IMAGE_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/avif": [0x00, 0x00, 0x00],
};

export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "Fichier trop lourd (max 5 Mo)" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Format non supporté (jpg, png, webp, avif uniquement)" };
  }

  const buffer = Buffer.from(await file.arrayBuffer().then((ab) => new Uint8Array(ab).slice(0, 12)));
  const sig = IMAGE_SIGNATURES[file.type];
  if (sig) {
    const matches = sig.every((byte, i) => buffer[i] === byte);
    if (!matches) {
      return { valid: false, error: "Le contenu du fichier ne correspond pas à son type déclaré" };
    }
  }

  return { valid: true };
}

export async function validateMediaFile(file: File): Promise<{ valid: boolean; error?: string; isVideo?: boolean }> {
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!isVideo && !isImage) {
    return { valid: false, error: "Format non supporté (jpg, png, webp, mp4, webm uniquement)" };
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `Fichier trop lourd (max ${isVideo ? "50" : "5"} Mo)` };
  }

  if (isImage) {
    const buffer = Buffer.from(await file.arrayBuffer().then((ab) => new Uint8Array(ab).slice(0, 12)));
    const sig = IMAGE_SIGNATURES[file.type];
    if (sig) {
      const matches = sig.every((byte, i) => buffer[i] === byte);
      if (!matches) {
        return { valid: false, error: "Le contenu du fichier ne correspond pas à son type déclaré" };
      }
    }
  }

  return { valid: true, isVideo };
}
