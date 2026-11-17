// Logo de la série d'où vient le personnage du portrait anime d'un membre.
// Ordre : série choisie dans l'admin, sinon liste par défaut (data/portrait-series.json,
// portraits identifiés), sinon rien (le logo du grade reste affiché).
import defaults from "../data/portrait-series.json";
import { TMDB_REF, type AnimeSeries, type MemberExtras } from "./member-extras";

const DEFAULTS = defaults as Record<string, AnimeSeries & { character?: string }>;

export function portraitSeries(m: { id: number; extras?: MemberExtras | null }): AnimeSeries | null {
  const s = m.extras?.animeSeries ?? DEFAULTS[String(m.id)];
  return s && TMDB_REF.test(s.tmdb) ? { title: s.title, tmdb: s.tmdb } : null;
}

/** Adresse du logo (servi par /api/series-logo), ou null si la série n'est pas connue. */
export const seriesLogoSrc = (m: { id: number; extras?: MemberExtras | null }) => {
  const s = portraitSeries(m);
  return s ? `/api/series-logo?tmdb=${s.tmdb}` : null;
};
