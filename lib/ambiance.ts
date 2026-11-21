// Ambiance du moment : saison (et fêtes) et moment de la journée, heure de Paris.
export type Season = "sakura" | "ete" | "automne" | "halloween" | "noel" | "hiver";
export type Daypart = "matin" | "jour" | "soir" | "nuit";

/** Saison décorative du jour (« AAAA-MM-JJ »). */
export function seasonOf(date: string): Season {
  const m = Number(date.slice(5, 7)), d = Number(date.slice(8, 10));
  if (m === 10 && d >= 20) return "halloween";
  if (m === 12 && d <= 31) return "noel";
  if (m <= 2) return "hiver";
  if (m === 3 && d < 20) return "hiver";
  if (m <= 5) return "sakura";
  if (m <= 8) return "ete";
  return "automne";
}
export function daypartOf(hour: number): Daypart {
  if (hour >= 6 && hour < 11) return "matin";
  if (hour >= 11 && hour < 18) return "jour";
  if (hour >= 18 && hour < 23) return "soir";
  return "nuit";
}
/** Date et heure de Paris de l'instant donné. */
export function parisNow(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
/** Particules de la saison : forme, couleurs, chute (vitesse verticale) et dérive. */
export const SEASON_PARTICLES: Record<Season, { shape: "petal" | "leaf" | "flake" | "spark"; colors: string[]; fall: number; drift: number }> = {
  sakura: { shape: "petal", colors: ["#ffc4d6", "#ff9ebb", "#ffe3ec"], fall: 0.5, drift: 0.6 },
  ete: { shape: "spark", colors: ["#ffe28a", "#fff4c2", "#ffd05a"], fall: -0.15, drift: 0.3 },
  automne: { shape: "leaf", colors: ["#e8412c", "#f5a524", "#c9732c", "#c9a84c"], fall: 0.6, drift: 0.8 },
  halloween: { shape: "leaf", colors: ["#f97316", "#a855f7", "#f5a524"], fall: 0.55, drift: 0.9 },
  noel: { shape: "flake", colors: ["#ffffff", "#dbeafe", "#fef3c7"], fall: 0.45, drift: 0.4 },
  hiver: { shape: "flake", colors: ["#ffffff", "#e0f2fe"], fall: 0.4, drift: 0.35 },
};
