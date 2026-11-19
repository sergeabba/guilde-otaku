// Génériques (openings et endings) des grandes séries pour la page Cinéma : vidéos
// officielles listées par TMDB et vérifiées intégrables (scripts/build-openings.mjs).
import data from "../data/anime-openings.json";

export interface Generique { series: string; tmdb: number; year: number | null; poster: string | null; kind: "OP" | "ED"; label: string | null; channel: string | null; key: string; lang: string | null }
export const GENERIQUES = data as Generique[];

/** Graine stable par date : le même tirage pour tout le monde ce jour-là. */
function seedOf(date: string) {
  let h = 2166136261;
  for (const c of date) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Opening et ending du jour : jamais la même série, et une série ne revient pas
 * avant d'avoir laissé passer les autres (rotation par jour, mélangée une fois pour toutes).
 */
export function dailyPair(list: Generique[], date: string): { op: number; ed: number } {
  const ops = list.map((g, i) => ({ g, i })).filter((x) => x.g.kind === "OP");
  const eds = list.map((g, i) => ({ g, i })).filter((x) => x.g.kind === "ED");
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const pick = (arr: typeof ops, salt: number) => {
    // Ordre mélangé fixe (graine constante) puis rotation d'un cran par jour.
    const order = [...arr].sort((a, b) => (seedOf(`${salt}-${a.g.key}`) - seedOf(`${salt}-${b.g.key}`)));
    return order[((day % order.length) + order.length) % order.length];
  };
  const op = pick(ops, 1);
  let ed = pick(eds, 2);
  if (ed && op && ed.g.tmdb === op.g.tmdb) ed = eds.find((x) => x.g.tmdb !== op.g.tmdb && x.i !== ed!.i) ?? ed;
  return { op: op?.i ?? -1, ed: ed?.i ?? -1 };
}
