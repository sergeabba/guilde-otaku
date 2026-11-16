// Duel de goûts : compatibilité entre deux membres, calculée UNIQUEMENT à partir de
// leurs vrais favoris (œuvres, genres) et de leur musique. Rien d'inventé : sans
// favoris d'un côté, pas de score.
import { sameWork, workTitle, type FavoriteWork, type MemberExtras } from "../member-extras";

export interface DuelSide { id: number; name: string; extras?: MemberExtras }
export interface DuelResult {
  score: number;               // 0 à 100
  verdict: string;
  common: string[];            // œuvres en commun
  genres: string[];            // genres partagés
  artists: string[];           // artistes en commun
  counts: [number, number];    // nombre de favoris de chacun
}

const works = (e?: MemberExtras): FavoriteWork[] => [...(e?.favoriteAnime ?? []), ...(e?.favoriteManga ?? [])];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function genreBag(list: FavoriteWork[]): Map<string, number> {
  const m = new Map<string, number>();
  // « Animation » est commun à tous les animes (TMDB) : il ne dit rien des goûts.
  for (const w of list) for (const g of w.genres ?? []) { const k = norm(g); if (k === "animation") continue; m.set(k, (m.get(k) ?? 0) + 1); }
  return m;
}

export const VERDICTS: [number, string][] = [
  [85, "Âmes sœurs otaku"], [65, "Nakama de canapé"], [45, "Bonne entente"], [25, "Goûts éloignés"], [0, "Rivaux jurés"],
];

export function duel(a: DuelSide, b: DuelSide): DuelResult | null {
  const wa = works(a.extras), wb = works(b.extras);
  if (!wa.length || !wb.length) return null;
  const common = wa.filter((w) => wb.some((x) => sameWork(w, x)));
  const ga = genreBag(wa), gb = genreBag(wb);
  const shared = [...ga.keys()].filter((g) => gb.has(g));
  const union = new Set([...ga.keys(), ...gb.keys()]);
  const genreSim = union.size ? shared.length / union.size : 0;
  const artistsA = new Set((a.extras?.music ?? []).map((t) => t.artist && norm(t.artist)).filter(Boolean) as string[]);
  const artists = [...new Set((b.extras?.music ?? []).map((t) => t.artist).filter((x): x is string => !!x && artistsA.has(norm(x))))];
  // Œuvres communes (jusqu'à 55 pts, relatif à la plus petite liste), genres (35), musique (10).
  const workSim = common.length / Math.min(wa.length, wb.length);
  const score = Math.round(Math.min(100, 55 * Math.min(1, workSim * 1.6) + 35 * Math.min(1, genreSim * 1.4) + Math.min(10, artists.length * 5)));
  const pretty = new Map<string, string>();
  for (const w of [...wa, ...wb]) for (const g of w.genres ?? []) pretty.set(norm(g), g);
  return {
    score,
    verdict: VERDICTS.find(([min]) => score >= min)![1],
    common: common.map(workTitle).filter(Boolean).slice(0, 8),
    genres: shared.sort((x, y) => (ga.get(y)! + gb.get(y)!) - (ga.get(x)! + gb.get(x)!)).slice(0, 5).map((g) => pretty.get(g) ?? g),
    artists: artists.slice(0, 4),
    counts: [wa.length, wb.length],
  };
}
