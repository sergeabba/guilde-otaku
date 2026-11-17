// Outils de partage d'un membre, utilisables côté serveur comme côté client.
import type { Member } from "../data/members";

type ShareFields = Pick<Member, "id" | "name" | "rank" | "photo" | "animeChar" | "badge" | "color" | "extras"> & Partial<Pick<Member, "birthday" | "country" | "bio">>;

/**
 * Empreinte courte des données visibles sur les images de partage.
 * Elle entre dans l'URL de l'image : quand le profil change, l'URL change,
 * ce qui contourne le cache des aperçus (WhatsApp, Discord...).
 */
export function shareVersion(m: ShareFields): string {
  const x = m.extras;
  const favs = [...(x?.favoriteAnime ?? []), ...(x?.favoriteManga ?? [])].map((w) => [w.titleRomaji, w.titleLocalized, w.coverUrl, w.featured, w.rank]);
  const src = [m.name, m.rank, m.photo, m.animeChar, m.badge ?? "", m.color, JSON.stringify(x?.photoFocus ?? ""), JSON.stringify(x?.animeFocus ?? ""),
    JSON.stringify(x?.awards ?? ""), JSON.stringify(favs), JSON.stringify(x?.music?.[0] ?? ""), m.birthday ?? "", m.country ?? "", JSON.stringify(x?.card ?? ""), m.bio ?? ""].join("|");
  let h = 2166136261;
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export const memberOgUrl = (m: ShareFields) => `/api/og/member?id=${m.id}&v=${shareVersion(m)}`;
export const memberCardUrl = (m: ShareFields, download = false, hd = false) =>
  `/api/card/member?id=${m.id}&v=${shareVersion(m)}${hd ? "&hd=1" : ""}${download ? "&download=1" : ""}`;
/** Nom de fichier lisible : « carte-otaku-craig-ryan.png ». */
export const fileSlug = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "membre";
export const memberProfilePath = (id: number) => `/membres/${id}`;
