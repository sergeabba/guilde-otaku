// Relie les favoris d'un membre aux chroniques de la Bibliothèque (Chronique du Bash), par titre.
import { DOSSIER_BASH_DATA, normalizeDossierBashKey } from "./dossier-bash";
import { workKey, type FavoriteWork } from "./member-extras";

/** Relie un favori à la Chronique du Bash quand elle en parle (par titre). */
export function chroniqueLinks(works: FavoriteWork[]): Record<string, string> {
  const index = new Map<string, string>();
  for (const c of DOSSIER_BASH_DATA) {
    const slug = normalizeDossierBashKey(c.title).replace(/\s+/g, "-");
    index.set(normalizeDossierBashKey(c.title), slug);
    index.set(normalizeDossierBashKey(c.searchQuery), slug);
  }
  const out: Record<string, string> = {};
  for (const w of works) {
    for (const t of [w.titleRomaji, w.titleLocalized]) {
      const slug = t && index.get(normalizeDossierBashKey(t));
      if (slug) { out[workKey(w)] = slug; break; }
    }
  }
  return out;
}
