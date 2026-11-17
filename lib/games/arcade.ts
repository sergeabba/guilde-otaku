// Règles des jeux « Affiche en morceaux », « Plus ou moins » et « Défi du jour ».
// Fonctions pures (testables) : tirage, corrigé dans un jeton signé, calcul des points.
// Module serveur.
import { randomUUID } from "node:crypto";
import catalog from "../../data/anime-songs.json";
import type { CatalogSong } from "../anime-song";
import type { PoolAnime } from "./pool";
import { LEVEL_MULT, type Level } from "./levels";
import { seal, seeded, shuffle, unseal } from "./token";

const SONGS = catalog as CatalogSong[];
const HOUR = 3_600_000;

/* ── L'Affiche en morceaux ─────────────────────────────────────────────── */
export const AFFICHE_ROUNDS = 8;
export const TILE_MS = 2_000;            // une case de plus toutes les 2 s
export const AFFICHE_MS = 9 * TILE_MS + 4_000;
/** Expert : une case toutes les 3 s et affiche en noir et blanc. */
export const LEVEL_TILE_MS: Record<Level, number> = { facile: TILE_MS, normal: TILE_MS, expert: 3_000 };
export interface AfficheRound { image: string; choices: string[]; order: number[]; tileMs?: number; gray?: boolean }
export interface AfficheKey { game: "affiche"; nonce: string; exp: number; ids: number[]; answers: number[]; level?: Level }

/** Cases visibles après `ms` millisecondes (1 au départ, 9 au plus). */
export const tilesAt = (ms: number, tileMs = TILE_MS) => Math.min(9, 1 + Math.floor(Math.max(0, ms) / tileMs));
/** 100 points avec une seule case visible, 10 de moins par case dévoilée ensuite. */
export const affichePoints = (ok: boolean, ms: number, tileMs = TILE_MS) => (ok ? 100 - (tilesAt(ms, tileMs) - 1) * 10 : 0);

export function buildAffiche(pool: PoolAnime[], now = Date.now(), rnd = Math.random, level?: Level) {
  const tileMs = level ? LEVEL_TILE_MS[level] : TILE_MS;
  const picked = shuffle(pool, rnd).slice(0, AFFICHE_ROUNDS);
  const rounds: AfficheRound[] = [], answers: number[] = [];
  for (const a of picked) {
    const wrong = shuffle(pool.filter((x) => x.id !== a.id), rnd).slice(0, 3).map((x) => x.title);
    const choices = shuffle([a.title, ...wrong], rnd);
    rounds.push({ image: a.cover, choices, order: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rnd), ...(level ? { tileMs, gray: level === "expert" } : {}) });
    answers.push(choices.indexOf(a.title));
  }
  const key: AfficheKey = { game: "affiche", nonce: randomUUID(), exp: now + HOUR / 2, ids: picked.map((a) => a.id), answers, ...(level ? { level } : {}) };
  return { token: seal(key), rounds };
}

export function scoreAffiche(key: AfficheKey, answers: { choice: number | null; ms: number }[], pool: PoolAnime[]) {
  const byId = new Map(pool.map((a) => [a.id, a]));
  const mult = key.level ? LEVEL_MULT[key.level] : 1, tileMs = key.level ? LEVEL_TILE_MS[key.level] : TILE_MS;
  const correction = key.ids.map((id, r) => {
    const a = answers[r], chosen = Number.isInteger(a?.choice) && a!.choice! >= 0 && a!.choice! < 4 ? a!.choice! : null;
    const ok = chosen === key.answers[r];
    const ms = Number.isFinite(a?.ms) ? Math.max(0, a!.ms) : AFFICHE_MS;
    return { title: byId.get(id)?.title ?? "?", cover: byId.get(id)?.cover ?? null, ok, tiles: tilesAt(ms, tileMs), points: Math.round(affichePoints(ok, ms, tileMs) * mult) };
  });
  return { score: correction.reduce((n, c) => n + c.points, 0), max: Math.round(key.ids.length * 100 * mult), good: correction.filter((c) => c.ok).length, correction };
}

/* ── Plus ou moins (note AniList, popularité en Expert) ───────────────── */
export const PM_LENGTH = 40;
export type PmMetric = "note" | "popularite";
export interface PmKey { game: "plus-moins"; nonce: string; exp: number; seq: number[]; pos: number; streak: number; level?: Level; metrics?: PmMetric[] }
export interface PmCard { title: string; cover: string; year: number | null }

const metricOf = (a: PoolAnime, m: PmMetric) => (m === "popularite" ? a.popularity ?? 0 : a.score);
/**
 * Le voisin suivant est-il jouable à ce niveau ?
 * Facile : notes éloignées (8 points ou plus). Normal : notes différentes.
 * Expert : notes très proches (5 points au plus) ou popularités proches (écart de 40 % au plus).
 */
export function pmFits(prev: PoolAnime, next: PoolAnime, m: PmMetric, level: Level): boolean {
  const a = metricOf(prev, m), b = metricOf(next, m);
  if (a === b || !a || !b) return false;
  if (level === "facile") return Math.abs(a - b) >= 8;
  if (level === "expert") return m === "note" ? Math.abs(a - b) <= 5 : Math.max(a, b) / Math.min(a, b) <= 1.4;
  return true;
}

/** Suite de 40 animes respectant les écarts du niveau (sinon la question est trop facile ou sans réponse). */
export function buildPlusMoins(pool: PoolAnime[], now = Date.now(), rnd = Math.random, level?: Level) {
  const lv = level ?? "normal";
  const metrics: PmMetric[] = Array.from({ length: PM_LENGTH }, () => (lv === "expert" && rnd() < 0.5 ? "popularite" : "note"));
  const left = shuffle(pool, rnd);
  const seq: PoolAnime[] = left.length ? [left.shift()!] : [];
  while (seq.length < PM_LENGTH && left.length) {
    const m = metrics[seq.length - 1];
    const k = left.findIndex((x) => pmFits(seq[seq.length - 1], x, m, lv));
    if (k < 0) break;
    seq.push(left.splice(k, 1)[0]);
  }
  const key: PmKey = { game: "plus-moins", nonce: randomUUID(), exp: now + HOUR, seq: seq.map((a) => a.id), pos: 0, streak: 0, ...(level ? { level, metrics: metrics.slice(0, Math.max(0, seq.length - 1)) } : {}) };
  const cards: PmCard[] = seq.map((a) => ({ title: a.title, cover: a.cover, year: a.year }));
  const m0 = key.metrics?.[0] ?? "note";
  return { token: seal(key), cards, first: seq[0] ? metricOf(seq[0], m0) : 0, metrics: key.metrics ?? null };
}

/** Une réponse : « plus » si la carte suivante a une valeur plus haute que la carte en cours. */
export function stepPlusMoins(key: PmKey, guess: "plus" | "moins", pool: PoolAnime[]) {
  const byId = new Map(pool.map((a) => [a.id, a]));
  const cur = byId.get(key.seq[key.pos]), next = byId.get(key.seq[key.pos + 1]);
  if (!cur || !next) return null;
  const m = key.metrics?.[key.pos] ?? "note";
  const ok = guess === "plus" ? metricOf(next, m) > metricOf(cur, m) : metricOf(next, m) < metricOf(cur, m);
  const streak = key.streak + (ok ? 1 : 0);
  const over = !ok || key.pos + 2 >= key.seq.length;
  const nextKey: PmKey = { ...key, pos: key.pos + 1, streak };
  // Valeur de la carte suivante pour la question d'après (la mesure peut changer en Expert).
  const nm = key.metrics?.[key.pos + 1] ?? "note";
  return { ok, score: metricOf(next, m), base: metricOf(next, nm), streak, over, token: over ? null : seal(nextKey), nonce: key.nonce };
}

/** Points d'une série : 10 par bonne réponse, multipliés selon le niveau. */
export const pmPoints = (streak: number, level?: Level) => Math.round(streak * 10 * (level ? LEVEL_MULT[level] : 1));

/* ── Défi du jour ──────────────────────────────────────────────────────── */
export type DailyKind = "generique" | "affiche" | "membre";
export interface DailyKey { game: "defi-jour"; date: string; exp: number; answer: number; kind: DailyKind; reveal: string }
export interface DailyMember { id: number; name: string; favorites: string[] }

/** Date du jour à Paris (AAAA-MM-JJ) : le défi change à minuit, heure française. */
export function parisDay(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export const dayIndex = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
export const DAILY_MS = 30_000;
export const dailyPoints = (ok: boolean, ms: number) => (ok ? 100 + Math.round(50 * (1 - Math.min(Math.max(ms, 0), DAILY_MS) / DAILY_MS)) : 0);

/** Une œuvre que seul un membre a en favori, pour la question « qui l'aime ? ». */
function memberQuestion(members: DailyMember[], rnd: () => number) {
  if (members.length < 4) return null;
  const count = new Map<string, number[]>();
  members.forEach((m, i) => new Set(m.favorites).forEach((f) => count.set(f, [...(count.get(f) ?? []), i])));
  const unique = [...count].filter(([, who]) => who.length === 1);
  if (!unique.length) return null;
  const [work, [owner]] = unique[Math.floor(rnd() * unique.length)];
  const others = shuffle(members.filter((_, i) => i !== owner), rnd).slice(0, 3);
  const choices = shuffle([members[owner], ...others], rnd);
  return { work, choices: choices.map((m) => m.name), answer: choices.indexOf(members[owner]), reveal: members[owner].name };
}

/**
 * Le défi d'une date : même question pour tout le monde ce jour-là. Alterne générique,
 * affiche et favori d'un membre ; si une source manque, passe à la suivante.
 * `previewOf` donne l'extrait d'un générique (null : écarté).
 */
export async function buildDaily(date: string, pool: PoolAnime[], members: DailyMember[], previewOf: (i: number) => Promise<string | null>) {
  const rnd = seeded(`guilde-defi-${date}`);
  const kinds: DailyKind[] = ["generique", "affiche", "membre"];
  const first = dayIndex(date) % 3;
  const exp = Date.parse(`${date}T00:00:00Z`) + 2 * 86_400_000;
  for (let k = 0; k < 3; k++) {
    const kind = kinds[(first + k) % 3];
    if (kind === "generique") {
      const order = shuffle(SONGS.map((_, i) => i), rnd);
      for (const i of order.slice(0, 8)) {
        const preview = await previewOf(i);
        if (!preview) continue;
        // Propositions du même univers : dessins animés français entre eux, animes japonais entre eux.
        const animes = [...new Set(SONGS.filter((s) => s.anime !== SONGS[i].anime && (s.lang === "fr") === (SONGS[i].lang === "fr")).map((s) => s.anime))];
        const choices = shuffle([SONGS[i].anime, ...shuffle(animes, rnd).slice(0, 3)], rnd);
        const key: DailyKey = { game: "defi-jour", date, exp, answer: choices.indexOf(SONGS[i].anime), kind, reveal: `${SONGS[i].anime} · ${SONGS[i].title}` };
        return { kind, prompt: "Quel anime ?", preview, choices, token: seal(key) };
      }
    }
    if (kind === "affiche" && pool.length >= 4) {
      const a = pool[Math.floor(rnd() * pool.length)];
      const choices = shuffle([a.title, ...shuffle(pool.filter((x) => x.id !== a.id), rnd).slice(0, 3).map((x) => x.title)], rnd);
      const key: DailyKey = { game: "defi-jour", date, exp, answer: choices.indexOf(a.title), kind, reveal: a.title };
      return { kind, prompt: "Quel anime se cache sous l'affiche ?", image: a.cover, order: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rnd), choices, token: seal(key) };
    }
    if (kind === "membre") {
      const q = memberQuestion(members, rnd);
      if (!q) continue;
      const key: DailyKey = { game: "defi-jour", date, exp, answer: q.answer, kind, reveal: q.reveal };
      return { kind, prompt: `Quel membre a « ${q.work} » dans ses favoris ?`, choices: q.choices, token: seal(key) };
    }
  }
  return null;
}

export const openDaily = (token: unknown) => unseal<DailyKey>(token, "defi-jour");
export const openAffiche = (token: unknown) => unseal<AfficheKey>(token, "affiche");
export const openPlusMoins = (token: unknown) => unseal<PmKey>(token, "plus-moins");

/** Série de jours consécutifs réussis, en partant d'aujourd'hui (ou d'hier si pas encore joué). */
export function dailyStreak(days: { date: string; ok: boolean }[], today: string): number {
  const okDays = new Set(days.filter((d) => d.ok).map((d) => d.date));
  let i = dayIndex(today);
  if (!okDays.has(today)) i--;
  let n = 0;
  const iso = (k: number) => new Date(k * 86_400_000).toISOString().slice(0, 10);
  while (okDays.has(iso(i))) { n++; i--; }
  return n;
}
