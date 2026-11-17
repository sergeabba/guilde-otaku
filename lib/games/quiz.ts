// Quiz des génériques : 10 extraits d'openings/endings, 4 animes proposés à chaque fois.
// Le corrigé ne quitte jamais le serveur en clair : il voyage dans un jeton signé (HMAC),
// et le score est calculé ici. Deux variantes : « nostalgie » (génériques français)
// et le défi entre amis (mêmes manches qu'une partie déjà jouée). Module serveur.
import { randomUUID } from "node:crypto";
import catalog from "../../data/anime-songs.json";
import type { CatalogSong } from "../anime-song";
import { LEVEL_MULT, type Level } from "./levels";
import { seal, shuffle, unseal } from "./token";

export const QUIZ_ROUNDS = 10;
export const ROUND_MS = 20_000;
/** Durée d'une manche selon le niveau ; en Expert, l'extrait ne dure que 5 s, pris au hasard. */
export const LEVEL_ROUND_MS: Record<Level, number> = { facile: 30_000, normal: 20_000, expert: 20_000 };
export const EXPERT_CLIP_S = 5;
const POINTS = 100, SPEED_BONUS = 50;
const SONGS = catalog as CatalogSong[];

export type QuizMode = "generique" | "nostalgie";
export interface QuizRound { preview: string; choices: string[]; start?: number; clip?: number }
export interface QuizKey { v: 1; nonce: string; exp: number; songs: number[]; answers: number[]; mode?: QuizMode; choices?: string[][]; defi?: number; level?: Level; starts?: number[] }
export interface QuizAnswer { choice: number | null; ms: number }
export interface QuizCorrection { anime: string; title: string; artist: string; kind: "OP" | "ED"; cover: string | null; correct: number; chosen: number | null; ok: boolean; points: number }

export const signKey = (key: QuizKey) => seal(key);
export function verifyKey(token: string, now = Date.now()): QuizKey | null {
  const k = unseal<QuizKey>(token, undefined, now);
  return k && k.v === 1 && Array.isArray(k.songs) ? k : null;
}

const inMode = (mode: QuizMode) => (s: CatalogSong) => (mode === "nostalgie" ? s.lang === "fr" : s.lang !== "fr");

/**
 * Tire les questions. `previewOf` donne l'extrait d'un titre (null : titre écarté).
 * Les trois mauvaises réponses sont d'autres animes du catalogue.
 */
export async function buildQuiz(previewOf: (i: number) => Promise<string | null>, now = Date.now(), mode: QuizMode = "generique", level?: Level): Promise<{ token: string; rounds: QuizRound[] }> {
  // Facile : openings seulement. Normal et Expert : openings et endings.
  const ok = (s: CatalogSong) => inMode(mode)(s) && (level !== "facile" || s.kind === "OP");
  const animes = [...new Set(SONGS.filter(inMode(mode)).map((s) => s.anime))];
  const picked: { i: number; preview: string }[] = [];
  const usedAnime = new Set<string>();
  for (const i of shuffle(SONGS.map((_, k) => k).filter((k) => ok(SONGS[k])))) {
    if (picked.length >= QUIZ_ROUNDS) break;
    if (usedAnime.has(SONGS[i].anime)) continue;
    const preview = await previewOf(i);
    if (!preview) continue;
    usedAnime.add(SONGS[i].anime);
    picked.push({ i, preview });
  }
  if (picked.length < 5) throw new Error("Extraits indisponibles pour le moment.");
  const rounds: QuizRound[] = [], answers: number[] = [], starts: number[] = [];
  for (const { i, preview } of picked) {
    const wrong = level === "expert" ? traps(SONGS[i], animes, 5) : shuffle(animes.filter((a) => a !== SONGS[i].anime)).slice(0, 3);
    const choices = shuffle([SONGS[i].anime, ...wrong]);
    // Expert : 5 secondes prises entre la 3e et la 22e seconde de l'extrait de 30 s.
    const start = level === "expert" ? 3 + Math.floor(Math.random() * 20) : undefined;
    rounds.push(start === undefined ? { preview, choices } : { preview, choices, start, clip: EXPERT_CLIP_S });
    answers.push(choices.indexOf(SONGS[i].anime));
    if (start !== undefined) starts.push(start);
  }
  const key: QuizKey = { v: 1, nonce: randomUUID(), exp: now + 30 * 60_000, songs: picked.map((p) => p.i), answers, mode, choices: rounds.map((r) => r.choices), ...(level ? { level } : {}), ...(starts.length ? { starts } : {}) };
  return { token: signKey(key), rounds };
}

/** Année du premier générique de chaque anime du catalogue. */
const YEAR = new Map<string, number>();
for (const s of SONGS) if (!YEAR.has(s.anime) || s.year < YEAR.get(s.anime)!) YEAR.set(s.anime, s.year);

/** Propositions pièges : les animes dont les génériques sont de la même époque. */
export function traps(song: CatalogSong, animes: string[], n: number): string[] {
  const near = animes.filter((a) => a !== song.anime).map((a) => ({ a, d: Math.abs((YEAR.get(a) ?? 0) - song.year) + Math.random() * 2 })).sort((x, y) => x.d - y.d);
  return shuffle(near.slice(0, n + 4).map((x) => x.a)).slice(0, n);
}

/**
 * Défi entre amis : rejoue exactement les manches d'une partie enregistrée (mêmes
 * extraits, mêmes propositions dans le même ordre). Renvoie null si la partie est incomplète.
 */
export async function buildChallenge(src: { songs?: unknown; choices?: unknown; mode?: unknown; level?: unknown; starts?: unknown }, defi: number, previewOf: (i: number) => Promise<string | null>, now = Date.now()): Promise<{ token: string; rounds: QuizRound[] } | null> {
  if (!Array.isArray(src.songs) || !Array.isArray(src.choices) || src.songs.length !== src.choices.length || src.songs.length < 5) return null;
  const rounds: QuizRound[] = [], answers: number[] = [], songs: number[] = [];
  for (let r = 0; r < src.songs.length; r++) {
    const i = Number(src.songs[r]), choices = src.choices[r];
    const song = SONGS[i];
    if (!song || !Array.isArray(choices) || (choices.length !== 4 && choices.length !== 6) || !choices.every((c) => typeof c === "string")) return null;
    const correct = choices.indexOf(song.anime);
    const preview = correct >= 0 ? await previewOf(i) : null;
    if (!preview) return null;
    const start = Array.isArray(src.starts) ? Number(src.starts[r]) : NaN;
    rounds.push(Number.isFinite(start) ? { preview, choices: choices as string[], start, clip: EXPERT_CLIP_S } : { preview, choices: choices as string[] }); answers.push(correct); songs.push(i);
  }
  const mode: QuizMode = src.mode === "nostalgie" ? "nostalgie" : "generique";
  const level = src.level === "facile" || src.level === "normal" || src.level === "expert" ? src.level : undefined;
  const starts = rounds.every((r) => r.start !== undefined) ? rounds.map((r) => r.start!) : undefined;
  const key: QuizKey = { v: 1, nonce: randomUUID(), exp: now + 30 * 60_000, songs, answers, mode, choices: rounds.map((r) => r.choices), defi, ...(level ? { level } : {}), ...(starts ? { starts } : {}) };
  return { token: signKey(key), rounds };
}

/** Points d'une manche : 100 si juste, + jusqu'à 50 selon la rapidité. */
export function roundPoints(ok: boolean, ms: number, roundMs = ROUND_MS): number {
  if (!ok) return 0;
  const t = Math.min(Math.max(ms, 0), roundMs);
  return POINTS + Math.round(SPEED_BONUS * (1 - t / roundMs));
}

export function scoreQuiz(key: QuizKey, answers: QuizAnswer[], coverOf: (i: number) => string | null = () => null) {
  // Parties sans niveau (avant les niveaux) : multiplicateur 1.
  const mult = key.level ? LEVEL_MULT[key.level] : 1;
  const roundMs = key.level ? LEVEL_ROUND_MS[key.level] : ROUND_MS;
  const n = key.choices?.[0]?.length ?? 4;
  const correction: QuizCorrection[] = key.songs.map((si, r) => {
    const a = answers[r];
    const chosen = a && Number.isInteger(a.choice) && a.choice! >= 0 && a.choice! < n ? a.choice! : null;
    const ok = chosen === key.answers[r];
    const s = SONGS[si];
    return { anime: s.anime, title: s.title, artist: s.artist, kind: s.kind, cover: coverOf(si), correct: key.answers[r], chosen, ok, points: Math.round(roundPoints(ok, Number(a?.ms) || roundMs, roundMs) * mult) };
  });
  return {
    score: correction.reduce((n, c) => n + c.points, 0),
    max: Math.round(key.songs.length * (POINTS + SPEED_BONUS) * mult),
    good: correction.filter((c) => c.ok).length,
    correction,
  };
}
