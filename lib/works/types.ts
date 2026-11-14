// Recherche d'œuvres (anime, films d'animation, mangas) commune à la Bibliothèque et
// aux favoris des membres. Les champs disent d'où vient chaque information et si elle
// est en français : rien n'est présenté comme français s'il ne l'est pas.

export type WorkKind = "ANIME" | "MANGA";
export type WorkSource = "tmdb" | "mangadex";

/** Forme précise de l'œuvre : on ne mélange pas série, film et manga. */
export type WorkFormat = "SERIE" | "FILM" | "MANGA" | "MANHWA" | "MANHUA";

export const FORMAT_LABEL: Record<WorkFormat, string> = {
  SERIE: "Série anime",
  FILM: "Film d'animation",
  MANGA: "Manga",
  MANHWA: "Manhwa (Corée)",
  MANHUA: "Manhua (Chine)",
};

export const SOURCE_LABEL: Record<WorkSource, string> = { tmdb: "TMDB", mangadex: "MangaDex" };

export interface WorkTrailer {
  /** Identifiant de vidéo YouTube. */
  youtubeId: string;
  /** Langue de la bande-annonce telle que donnée par la source (fr, en, ja…). */
  lang?: string;
  name?: string;
}

export interface WorkCandidate {
  source: WorkSource;
  /** Identifiant stable dans la source : « tv:209867 », « movie:129 » ou UUID MangaDex. */
  sourceId: string;
  kind: WorkKind;
  format: WorkFormat;
  /** Titre affichable (alphabet latin), toujours présent. */
  title: string;
  /** Titre français fourni par la source, s'il existe. */
  titleFr?: string;
  /** Vrai si le titre français vient d'un champ libre non vérifié (titres alternatifs MangaDex). */
  titleFrUnverified?: boolean;
  /** Titre rōmaji (MangaDex « ja-ro »), sans écriture japonaise. */
  titleRomaji?: string;
  /** Titre anglais, pour s'y retrouver entre homonymes. */
  titleEn?: string;
  year?: number;
  /** Synopsis en français fourni par la source. Absent s'il n'existe pas. */
  synopsisFr?: string;
  /** Provenance du synopsis français quand il ne vient pas de la source elle-même (Wikipédia, adaptation animée). */
  synopsisCredit?: { label: string; url: string };
  /** Synopsis anglais : référence pour rédiger un texte français, jamais affiché comme français. */
  synopsisEn?: string;
  /** Couverture affichable : TMDB direct, MangaDex via notre proxy (règle MangaDex). */
  coverUrl?: string;
  /** Lien vers la fiche de l'œuvre chez la source. */
  sourceUrl: string;
  genres?: string[];
  /** Nombre d'épisodes, de saisons ou de chapitres, quand la source le donne. */
  episodes?: number;
  seasons?: number;
  status?: string;
  trailer?: WorkTrailer;
  /** Identifiant AniList quand la source le connaît (lien avec les anciens favoris). */
  anilistId?: number;
}

/** Niveau de français disponible : affiché avant la sélection. */
export function frenchLevel(c: Pick<WorkCandidate, "titleFr" | "titleFrUnverified" | "synopsisFr">): "complet" | "partiel" | "aucun" {
  const title = !!c.titleFr && !c.titleFrUnverified;
  if (title && c.synopsisFr) return "complet";
  if (title || c.synopsisFr) return "partiel";
  return "aucun";
}
