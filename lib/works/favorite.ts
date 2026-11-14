// Conversion d'un résultat de recherche en favori de membre (utilisable côté client).
import type { FavoriteWork } from "../member-extras";
import type { WorkCandidate } from "./types";

/**
 * Le titre français non vérifié (titres alternatifs MangaDex) n'est pas repris
 * automatiquement : l'admin le confirme d'un clic. Le synopsis anglais n'est jamais
 * enregistré comme synopsis : il sert de référence pour écrire le texte français.
 */
export function candidateToFavorite(c: WorkCandidate, opts: { useUnverifiedFrTitle?: boolean } = {}): FavoriteWork {
  const fr = c.titleFr && (!c.titleFrUnverified || opts.useUnverifiedFrTitle) ? c.titleFr : undefined;
  const w: FavoriteWork = {
    source: c.source,
    sourceId: c.sourceId,
    kind: c.kind,
    titleLocalized: fr ?? c.title,
    titleRomaji: c.titleRomaji && c.titleRomaji !== (fr ?? c.title) ? c.titleRomaji : undefined,
    coverUrl: c.coverUrl,
    sourceUrl: c.sourceUrl,
    format: c.format,
  };
  if (c.synopsisFr) { w.synopsis = c.synopsisFr.slice(0, 700); w.synopsisSource = "source"; }
  if (c.year) w.year = c.year;
  if (c.genres?.length) w.genres = c.genres.slice(0, 5);
  if (c.trailer) w.trailer = { youtubeId: c.trailer.youtubeId, ...(c.trailer.lang ? { lang: c.trailer.lang } : {}) };
  if (c.anilistId) w.anilistId = c.anilistId;
  return w;
}

/** Libellé de langue d'une bande-annonce, pour ne pas présenter une VO comme une VF. */
export function trailerLangLabel(lang?: string): string {
  if (lang === "fr") return "en français";
  if (lang === "en") return "en anglais";
  if (lang === "ja") return "en japonais";
  return "langue non précisée";
}
