// Primes du Wanted : calculées à partir de données réelles de la fiche de chaque membre
// (grade, statistiques Fighters, palmarès, distinction, favoris). Chaque ligne du calcul
// est affichée sur la page : rien n'est tiré au hasard ni voté.
import type { Rank } from "../data/members";

export const MILLION = 1_000_000;

/** Prime de base selon le grade (en berrys). */
export const RANK_BOUNTY: Record<Rank, number> = {
  "Fondateur": 1_500 * MILLION,
  "Monarque": 1_200 * MILLION,
  "Ex Monarque": 900 * MILLION,
  "Ordre Céleste": 600 * MILLION,
  "Revenant": 400 * MILLION,
  "Vieux Briscard": 300 * MILLION,
  "New G dorée": 200 * MILLION,
  "Futurs Espoirs": 120 * MILLION,
  "Fantôme": 50 * MILLION,
};

/** Règles affichées en tête de page (une par ligne du calcul). */
export const BOUNTY_RULES = {
  power: { label: "Puissance", per: MILLION, text: "1 million par point de force, de vitesse et de technique (statistiques de Fighters)." },
  awards: { label: "Palmarès", per: 50 * MILLION, text: "50 millions par distinction inscrite au palmarès de la fiche." },
  badge: { label: "Titre officiel", per: 100 * MILLION, text: "100 millions pour un titre officiel de la Guilde (badge de la fiche)." },
  culture: { label: "Culture otaku", per: 3 * MILLION, cap: 30, text: "3 millions par anime ou manga favori, 30 œuvres au plus." },
} as const;

export interface BountyInput {
  rank: Rank;
  stats?: { force?: number; vitesse?: number; technique?: number } | null;
  badge?: string | null;
  extras?: { awards?: unknown[]; favoriteAnime?: unknown[]; favoriteManga?: unknown[] } | null;
}
export interface BountyLine { key: "rank" | keyof typeof BOUNTY_RULES; label: string; detail: string; amount: number }

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);

/** Prime totale et détail ligne par ligne (les lignes à 0 sont gardées : la fiche peut les remplir). */
export function bounty(m: BountyInput): { total: number; lines: BountyLine[] } {
  const power = n(m.stats?.force) + n(m.stats?.vitesse) + n(m.stats?.technique);
  const awards = m.extras?.awards?.length ?? 0;
  const works = (m.extras?.favoriteAnime?.length ?? 0) + (m.extras?.favoriteManga?.length ?? 0);
  const counted = Math.min(works, BOUNTY_RULES.culture.cap);
  const lines: BountyLine[] = [
    { key: "rank", label: "Grade", detail: m.rank, amount: RANK_BOUNTY[m.rank] ?? 0 },
    { key: "power", label: BOUNTY_RULES.power.label, detail: `${power} points`, amount: power * BOUNTY_RULES.power.per },
    { key: "awards", label: BOUNTY_RULES.awards.label, detail: `${awards} distinction${awards > 1 ? "s" : ""}`, amount: awards * BOUNTY_RULES.awards.per },
    { key: "badge", label: BOUNTY_RULES.badge.label, detail: m.badge ? m.badge : "aucun", amount: m.badge ? BOUNTY_RULES.badge.per : 0 },
    { key: "culture", label: BOUNTY_RULES.culture.label, detail: `${works} œuvre${works > 1 ? "s" : ""}${works > counted ? ` (${counted} comptées)` : ""}`, amount: counted * BOUNTY_RULES.culture.per },
  ];
  return { total: lines.reduce((s, l) => s + l.amount, 0), lines };
}

/** « 1,234,000,000- » : le format des avis de recherche (virgules, tiret final). */
export const formatBounty = (v: number) => `${v.toLocaleString("en-US")}-`;
/** « 1,23 milliard », « 450 millions » : lecture à voix haute, en français. */
export function sayBounty(v: number): string {
  if (v >= 1_000 * MILLION) { const b = v / (1_000 * MILLION); return `${b.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} milliard${b >= 2 ? "s" : ""}`; }
  const m = v / MILLION;
  return `${m.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} million${m >= 2 ? "s" : ""}`;
}
