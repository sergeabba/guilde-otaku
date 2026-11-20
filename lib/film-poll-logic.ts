// Votes de films : fonctions pures (statut, durée, résultats). Partagé serveur et navigateur.

export interface PollFilm {
  tmdb: number; title: string; year: number | null; poster: string | null; backdrop: string | null;
  overview: string | null; runtime: number | null; director: string | null; genres: string | null;
  note: number | null; trailer: string | null;
}
export interface FilmPoll { id: number; slug: string; title: string; films: PollFilm[]; starts_at: string; ends_at: string; created_at?: string }
export interface PollTally { counts: Record<number, number>; pct: Record<number, number>; total: number; leaders: number[] }

/** Durées proposées à l'admin (en heures). */
export const DURATIONS = [
  { hours: 24, label: "24 heures" },
  { hours: 36, label: "36 heures" },
  { hours: 48, label: "48 heures" },
  { hours: 72, label: "3 jours" },
  { hours: 168, label: "Une semaine" },
] as const;
export const MAX_HOURS = 24 * 14;

export const isOpen = (p: Pick<FilmPoll, "starts_at" | "ends_at">, now = Date.now()) => Date.parse(p.starts_at) <= now && now < Date.parse(p.ends_at);

/** Pourcentages entiers qui font toujours 100 (méthode du plus fort reste). */
export function tally(films: Pick<PollFilm, "tmdb">[], votes: { choice: number }[]): PollTally {
  const counts: Record<number, number> = {};
  for (const f of films) counts[f.tmdb] = 0;
  for (const v of votes) if (v.choice in counts) counts[v.choice]++;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const pct: Record<number, number> = {};
  if (!total) { for (const f of films) pct[f.tmdb] = 0; return { counts, pct, total, leaders: [] }; }
  const raw = films.map((f) => ({ id: f.tmdb, exact: (counts[f.tmdb] * 100) / total }));
  raw.forEach((r) => (pct[r.id] = Math.floor(r.exact)));
  let rest = 100 - raw.reduce((s, r) => s + pct[r.id], 0);
  for (const r of [...raw].sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)))) { if (rest-- <= 0) break; pct[r.id]++; }
  const best = Math.max(...Object.values(counts));
  return { counts, pct, total, leaders: films.filter((f) => counts[f.tmdb] === best).map((f) => f.tmdb) };
}

/** « 1 j 4 h », « 5 h 12 min », « 3 min » : temps restant lisible. */
export function timeLeft(ms: number): string {
  if (ms <= 0) return "terminé";
  const m = Math.floor(ms / 60_000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mn = m % 60;
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${String(mn).padStart(2, "0")} min`;
  return mn ? `${mn} min` : "moins d'une minute";
}

/** Adresse lisible du sondage : « film-de-la-semaine-20-novembre ». */
export function pollSlug(title: string, date: Date, suffix = ""): string {
  const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(date);
  const base = `${title} ${day}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 52);
  return `${base || "vote"}${suffix ? `-${suffix}` : ""}`.slice(0, 60);
}
