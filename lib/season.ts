// Saisons de diffusion (AniList) : utilisable côté serveur et navigateur.
export type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";
export const SEASON_FR: Record<Season, string> = { WINTER: "Hiver", SPRING: "Printemps", SUMMER: "Été", FALL: "Automne" };

/** Saison AniList d'une date (décembre compte pour l'hiver de l'année suivante). */
export function seasonOf(d: Date): { season: Season; year: number } {
  const m = d.getUTCMonth() + 1, y = d.getUTCFullYear();
  if (m === 12) return { season: "WINTER", year: y + 1 };
  if (m <= 2) return { season: "WINTER", year: y };
  if (m <= 5) return { season: "SPRING", year: y };
  if (m <= 8) return { season: "SUMMER", year: y };
  return { season: "FALL", year: y };
}

export function nextSeason(s: { season: Season; year: number }): { season: Season; year: number } {
  const order: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const i = order.indexOf(s.season);
  return i === 3 ? { season: "WINTER", year: s.year + 1 } : { season: order[i + 1], year: s.year };
}

export const seasonLabel = (s: { season: Season; year: number }) => `${SEASON_FR[s.season]} ${s.year}`;
