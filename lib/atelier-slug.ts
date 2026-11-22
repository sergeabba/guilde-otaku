// Liens courts des futilités : /f/<titre-en-minuscules>, sans le nom du fichier.
// Deux futilités au même titre sont départagées par 4 caractères tirés du fichier.

/** « Raijin de Craig ! » → « raijin-de-craig ». */
export function slugOf(title: string): string {
  const s = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/, "");
  return s || "futilite";
}
/** 4 caractères stables tirés de la clé (nom du fichier ou identifiant de vidéo). */
export function tagOf(key: string): string {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36).slice(-4).padStart(4, "0");
}

interface Item { title: string; key: string }

/** Lien court d'une futilité parmi toutes (suffixe seulement si un autre titre est identique). */
export function shortSlug(item: Item, all: Item[]): string {
  const s = slugOf(item.title);
  return all.filter((x) => slugOf(x.title) === s).length > 1 ? `${s}-${tagOf(item.key)}` : s;
}

/** Retrouve la futilité d'un lien court (avec ou sans suffixe). */
export function findBySlug<T>(slug: string, all: T[], get: (t: T) => Item): T | null {
  const s = slug.toLowerCase().slice(0, 64);
  const exact = all.filter((t) => slugOf(get(t).title) === s);
  if (exact.length) return exact[0];
  return all.find((t) => `${slugOf(get(t).title)}-${tagOf(get(t).key)}` === s) ?? null;
}
