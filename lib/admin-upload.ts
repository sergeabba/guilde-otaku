// Règles d'envoi des portraits (partagées entre la route serveur et les tests).

export const UPLOAD_BUCKET = "guilde-images";

export const UPLOAD_KINDS = {
  photo: { field: "photo", media: "image" },
  anime: { field: "animechar", media: "image" },
  photovideo: { field: "photovideo", media: "video" },
  animevideo: { field: "animevideo", media: "video" },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

const TYPES: Record<string, { ext: string; media: "image" | "video" }> = {
  "image/jpeg": { ext: "jpg", media: "image" },
  "image/png": { ext: "png", media: "image" },
  "image/webp": { ext: "webp", media: "image" },
  "image/avif": { ext: "avif", media: "image" },
  "video/mp4": { ext: "mp4", media: "video" },
  "video/webm": { ext: "webm", media: "video" },
  "video/quicktime": { ext: "mov", media: "video" },
};

export const MAX_BYTES = { image: 8 * 1024 * 1024, video: 50 * 1024 * 1024 } as const;

export function slugify(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "membre";
}

/**
 * Chemin de stockage d'un nouveau portrait. Le nom contient l'horodatage :
 * remplacer une photo crée un nouveau fichier (nouvelle URL, pas de cache périmé)
 * et l'ancien fichier reste dans le stockage (aucune perte).
 */
export function planUpload(input: { kind: unknown; contentType: unknown; size: unknown; memberId: unknown; memberName: unknown }, now = Date.now()):
  { path: string; field: string } | { error: string } {
  const kind = input.kind as UploadKind;
  if (typeof input.kind !== "string" || !Object.hasOwn(UPLOAD_KINDS, kind)) return { error: "type de portrait inconnu" };
  const type = typeof input.contentType === "string" ? TYPES[input.contentType] : undefined;
  if (!type) return { error: "format non pris en charge (jpg, png, webp, avif, mp4, webm, mov)" };
  if (type.media !== UPLOAD_KINDS[kind].media) return { error: type.media === "video" ? "une vidéo n'est pas une image" : "une image n'est pas une vidéo" };
  if (typeof input.size !== "number" || !(input.size > 0)) return { error: "fichier vide" };
  if (input.size > MAX_BYTES[type.media]) return { error: `fichier trop lourd (${MAX_BYTES[type.media] / 1024 / 1024} Mo max)` };
  if (typeof input.memberId !== "number" || !Number.isSafeInteger(input.memberId) || input.memberId <= 0) return { error: "membre invalide" };
  const name = typeof input.memberName === "string" ? input.memberName : "";
  return {
    path: `fighters/${slugify(name)}_${input.memberId}_${kind}_${now.toString(36)}.${type.ext}`,
    field: UPLOAD_KINDS[kind].field,
  };
}
