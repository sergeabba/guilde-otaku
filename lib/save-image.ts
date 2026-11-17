// Enregistrer une image produite par le site (carte Otaku, affiche Wanted).
// iPhone / iPad : Safari ne peut pas écrire directement dans Photos ; la feuille de
// partage d'iOS, ouverte avec l'image, propose « Enregistrer l'image » (galerie).
// Ailleurs : téléchargement classique du fichier.
export type SaveResult = "shared" | "downloaded" | "needs-tap" | "cancelled";

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export async function saveImage(blob: Blob, fileName: string): Promise<SaveResult> {
  if (isIOS() && typeof navigator.share === "function") {
    const file = new File([blob], fileName, { type: blob.type || "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return "shared";
      } catch (e) {
        const name = (e as DOMException)?.name;
        if (name === "AbortError") return "cancelled";
        // L'image a mis trop de temps à arriver : iOS exige un nouvel appui pour ouvrir le partage.
        if (name === "NotAllowedError") return "needs-tap";
      }
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "downloaded";
}

/** Message à afficher après l'enregistrement. */
export const saveMessage = (r: SaveResult, what: string) =>
  r === "shared" ? `${what} prête : choisis « Enregistrer l'image » pour la mettre dans Photos`
    : r === "needs-tap" ? `${what} prête : touche encore le bouton pour l'enregistrer dans Photos`
      : r === "downloaded" ? `${what} téléchargée` : "";
