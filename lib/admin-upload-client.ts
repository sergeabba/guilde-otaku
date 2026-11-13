// Envoi d'un portrait depuis le navigateur de l'admin.
// 1. Les photos sont réduites (2000 px max, JPEG) : une photo de téléphone de 6 Mo
//    passe à quelques centaines de Ko, sans agrandissement artificiel.
// 2. Le serveur délivre une adresse signée ; le fichier part directement vers le stockage.
import type { UploadKind } from "./admin-upload";

const MAX_SIDE = 2000;

export async function shrinkImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.88));
    // On garde l'original s'il est déjà plus léger (petite image optimisée).
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // format que le navigateur ne sait pas décoder : envoyé tel quel
  }
}

export class UploadError extends Error {}

export async function uploadPortrait(
  file: File,
  opts: { kind: UploadKind; memberId: number; memberName: string },
  onStep?: (step: "compression" | "autorisation" | "envoi") => void,
): Promise<{ publicUrl: string; field: string }> {
  onStep?.("compression");
  const body = opts.kind === "photo" || opts.kind === "anime" ? await shrinkImage(file) : file;
  const contentType = body.type || file.type;

  onStep?.("autorisation");
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: opts.kind, contentType, size: body.size, memberId: opts.memberId, memberName: opts.memberName }),
  });
  const plan = await res.json().catch(() => null);
  if (!res.ok) throw new UploadError(res.status === 401 ? "Session expirée : reconnecte-toi" : plan?.error || `Erreur ${res.status}`);

  onStep?.("envoi");
  const form = new FormData();
  form.append("cacheControl", "31536000");
  form.append("", body, file.name);
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const put = await fetch(plan.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false", ...(anon ? { apikey: anon } : {}) },
    body: form,
  }).catch(() => null);
  if (!put) throw new UploadError("Envoi interrompu : vérifie la connexion et réessaie");
  if (!put.ok) {
    const detail = await put.json().catch(() => null);
    throw new UploadError(`Le stockage a refusé le fichier${detail?.message ? ` (${detail.message})` : ""}`);
  }
  return { publicUrl: plan.publicUrl, field: plan.field };
}
