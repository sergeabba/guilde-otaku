// Règles des jeux « Affiche en morceaux », « Plus ou moins » et « Défi du jour ».
// Fonctions pures (testables) : tirage, corrigé dans un jeton signé, calcul des points.
// Module serveur.
import { randomUUID } from "node:crypto";
import catalog from "../../data/anime-songs.json";
import type { CatalogSong } from "../anime-song";
import type { PoolAnime } from "./pool";
import { seal, seeded, shuffle, unseal } from "./token";

const SONGS = catalog as CatalogSong[];
const HOUR = 3_600_000;

/* ── L'Affiche en morceaux ─────────────────────────────────────────────── */
export const AFFICHE_ROUNDS = 8;
export const TILE_MS = 2_000;            // une case de plus toutes les 2 s
export const AFFICHE_MS = 9 * TILE_MS + 4_000;
export interface AfficheRound { image: string; choices: string[]; order: number[] }
export interface AfficheKey { game: "affiche"; nonce: string; exp: number; ids: number[]; answers: number[] }

/** Cases visibles après `ms` millisecondes (1 au départ, 9 au plus). */
export const tilesAt = (ms: number) => Math.min(9, 1 + Math.floor(Math.max(0, ms) / TILE_MS));
/** 100 points avec une seule case visible, 10 de moins par case dévoilée ensuite. */
export const affichePoints = (ok: boolean, ms: number) => (ok ? 100 - (tilesAt(ms) - 1) * 10 : 0);

export function buildAffiche(pool: PoolAnime[], now = Date.now(), rnd = Math.random) {
  const picked = shuffle(pool, rnd).slice(0, AFFICHE_ROUNDS);
  const rounds: AfficheRound[] = [], answers: number[] = [];
  for (const a of picked) {
    const wrong = shuffle(pool.filter((x) => x.id !== a.id), rnd).slice(0, 3).map((x) => x.title);
    const choices = shuffle([a.title, ...wrong], rnd);
    rounds.push({ image: a.cover, choices, order: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rnd) });
    answers.push(choices.indexOf(a.title));
  }
  const key: AfficheKey = { game: "affiche", nonce: randomUUID(), exp: now + HOUR / 2, ids: picked.map((a) => a.id), answers };
  return { token: seal(key), rounds };
}

export function scoreAffiche(key: AfficheKey, answers: { choice: number | null; ms: number }[], pool: PoolAnime[]) {
  const byId = new Map(pool.map((a) => [a.id, a]));
  const correction = key.ids.map((id, r) => {
    const a = answers[r], chosen = Number.isInteger(a?.choice) && a!.choice! >= 0 && a!.choice! < 4 ? a!.choice! : null;
    const ok = chosen === key.answers[r];
    const ms = Number.isFinite(a?.ms) ? Math.max(0, a!.ms) : AFFICHE_MS;
    return { title: byId.get(id)?.title ?? "?", cover: byId.get(id)?.cover ?? null, ok, tiles: tilesAt(ms), points: affichePoints(ok, ms) };
  });
  return { score: correction.reduce((n, c) => n + c.points, 0), max: key.ids.length * 100, good: correction.filter((c) => c.ok).length, correction };
}

/* ── Plus ou moins (note AniList) ──────────────────────────────────────── */
export const PM_LENGTH = 40;
export interface PmKey { game: "plus-moins"; nonce: string; exp: number; seq: number[]; pos: number; streak: number }
export interface PmCard { title: string; cover: string; year: number | null }

/** Suite de 40 animes où deux voisins n'ont jamais la même note (sinon la question n'a pas de réponse). */
export function buildPlusMoins(pool: PoolAnime[], now = Date.now(), rnd = Math.random) {
  const seq: PoolAnime[] = [];
  for (const a of shuffle(pool, rnd)) {
    if (seq.length >= PM_LENGTH) break;
    if (seq.length && seq[seq.length - 1].score === a.score) continue;
    seq.push(a);
  }
  const key: PmKey = { game: "plus-moins", nonce: randomUUID(), exp: now + HOUR, seq: seq.map((a) => a.id), pos: 0, streak: 0 };
  const cards: PmCard[] = seq.map((a) => ({ title: a.title, cover: a.cover, year: a.year }));
  return { token: seal(key), cards, first: seq[0]?.score ?? 0 };
}

/** Une réponse : « plus » si la carte suivante a une meilleure note que la carte en cours. */
export function stepPlusMoins(key: PmKey, guess: "plus" | "moins", pool: PoolAnime[]) {
  const byId = new Map(pool.map((a) => [a.id, a]));
  const cur = byId.get(key.seq[key.pos]), next = byId.get(key.seq[key.pos + 1]);
  if (!cur || !next) return null;
  const ok = guess === "plus" ? next.score > cur.score : next.score < cur.score;
  const streak = key.streak + (ok ? 1 : 0);
  const over = !ok || key.pos + 2 >= key.seq.length;
  const nextKey: PmKey = { ...key, pos: key.pos + 1, streak };
  return { ok, score: next.score, streak, over, token: over ? null : seal(nextKey), nonce: key.nonce };
}

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
