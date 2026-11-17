// Tier list de la Guilde : chacun classe les animes diffusés cette semaine de S à D ;
// le site affiche la moyenne et les joueurs qui pensent pareil. Fonctions pures.
export const TIERS = ["S", "A", "B", "C", "D"] as const;
export type Tier = (typeof TIERS)[number];
export interface TierEntry { id: number; title: string; cover: string | null; tier: Tier }
export interface TierRow { device: string; member_id: number | null; player_name: string | null; ranks: TierEntry[] }

/** Semaine ISO (AAAA-Www) : la tier list repart de zéro chaque lundi. */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86_400_000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

const val = (t: Tier) => 4 - TIERS.indexOf(t); // S = 4 … D = 0

/** Garde les entrées valides d'un classement envoyé par le navigateur (animes proposés seulement). */
export function cleanRanks(input: unknown, allowed: Map<number, { title: string; cover: string | null }>): TierEntry[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>(), out: TierEntry[] = [];
  for (const e of input as { id?: unknown; tier?: unknown }[]) {
    const id = Number(e?.id), tier = e?.tier as Tier;
    const a = allowed.get(id);
    if (!a || seen.has(id) || !TIERS.includes(tier)) continue;
    seen.add(id);
    out.push({ id, title: a.title, cover: a.cover, tier });
  }
  return out;
}

/** Moyenne de la Guilde par anime, du mieux classé au moins bien classé. */
export function tierResults(rows: TierRow[]) {
  const acc = new Map<number, { id: number; title: string; cover: string | null; sum: number; votes: number }>();
  for (const r of rows) for (const e of r.ranks) {
    const a = acc.get(e.id) ?? { id: e.id, title: e.title, cover: e.cover, sum: 0, votes: 0 };
    a.sum += val(e.tier); a.votes++; acc.set(e.id, a);
  }
  return [...acc.values()].map((a) => {
    const avg = a.sum / a.votes;
    return { id: a.id, title: a.title, cover: a.cover, votes: a.votes, avg: Math.round(avg * 100) / 100, tier: TIERS[4 - Math.round(avg)] };
  }).sort((x, y) => y.avg - x.avg || y.votes - x.votes);
}

/** Paires de joueurs aux classements les plus proches (au moins 3 animes en commun). */
export function tierTwins(rows: TierRow[], label: (r: TierRow) => string, top = 3) {
  const pairs: { a: string; b: string; pct: number; shared: number }[] = [];
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const B = new Map(rows[j].ranks.map((e) => [e.id, e.tier]));
    const diffs = rows[i].ranks.filter((e) => B.has(e.id)).map((e) => Math.abs(val(e.tier) - val(B.get(e.id)!)));
    if (diffs.length < 3) continue;
    const pct = Math.round(100 * (1 - diffs.reduce((n, d) => n + d, 0) / (diffs.length * 4)));
    pairs.push({ a: label(rows[i]), b: label(rows[j]), pct, shared: diffs.length });
  }
  return pairs.sort((x, y) => y.pct - x.pct || y.shared - x.shared).slice(0, top);
}
