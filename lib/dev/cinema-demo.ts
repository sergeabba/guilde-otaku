// Catalogue factice de développement pour tester le Cinéma « avec catalogue » sans clé TMDB.
// Seulement en dev avec /cinema?demo=catalogue ; jamais utilisé en production.
// Titres et images viennent de la Chronique (affiches TMDB réelles) ; notes FICTIVES.
import { DOSSIER_BASH_DATA } from "../dossier-bash";
import type { CinemaItem } from "../cinema";

const withArt = DOSSIER_BASH_DATA.filter((e) => e.hdCover && e.backdrop);
const item = (kind: CinemaItem["kind"]) => (e: (typeof withArt)[number], i: number): CinemaItem => ({
  kind, id: 70000 + i, title: e.title,
  overview: e.review.split("\n\n")[0] + " (synopsis de démonstration)",
  poster: e.hdCover!.replace("/w780/", "/w342/"), backdrop: e.backdrop!,
  year: 2026, rating: Math.round((8.6 - (i % 5) * 0.4) * 10) / 10,
});

export const CINEMA_DEMO = {
  series: withArt.slice(0, 10).map(item("tv")),
  free: withArt.slice(10, 18).map(item("tv")),
  films: withArt.slice(18, 26).map(item("movie")),
};
