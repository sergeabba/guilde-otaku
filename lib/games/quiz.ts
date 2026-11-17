// Quiz des génériques : 10 extraits d'openings/endings, 4 animes proposés à chaque fois.
// Le corrigé ne quitte jamais le serveur en clair : il voyage dans un jeton signé (HMAC),
// et le score est calculé ici. Deux variantes : « nostalgie » (génériques français)
// et le défi entre amis (mêmes manches qu'une partie déjà jouée). Module serveur.
import { randomUUID } from "node:crypto";
import catalog from "../../data/anime-songs.json";
import type { CatalogSong } from "../anime-song";
import { seal, shuffle, unseal } from "./token";

export const QUIZ_ROUNDS = 10;
export const ROUND_MS = 20_000;
const POINTS = 100, SPEED_BONUS = 50;
const SONGS = catalog as CatalogSong[];

export type QuizMode = "generique" | "nostalgie";
export interface QuizRound { preview: string; choices: string[] }
export interface QuizKey { v: 1; nonce: string; exp: number; songs: number[]; answers: number[]; mode?: QuizMode; choices?: string[][]; defi?: number }
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
export async function buildQuiz(previewOf: (i: number) => Promise<string | null>, now = Date.now(), mode: QuizMode = "generique"): Promise<{ token: string; rounds: QuizRound[] }> {
  const ok = inMode(mode);
  const animes = [...new Set(SONGS.filter(ok).map((s) => s.anime))];
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
  const rounds: QuizRound[] = [], answers: number[] = [];
  for (const { i, preview } of picked) {
    const wrong = shuffle(animes.filter((a) => a !== SONGS[i].anime)).slice(0, 3);
    const choices = shuffle([SONGS[i].anime, ...wrong]);
    rounds.push({ preview, choices });
    answers.push(choices.indexOf(SONGS[i].anime));
  }
  const key: QuizKey = { v: 1, nonce: randomUUID(), exp: now + 30 * 60_000, songs: picked.map((p) => p.i), answers, mode, choices: rounds.map((r) => r.choices) };
  return { token: signKey(key), rounds };
}

/**
 * Défi entre amis : rejoue exactement les manches d'une partie enregistrée (mêmes
 * extraits, mêmes propositions dans le même ordre). Renvoie null si la partie est incomplète.
 */
export async function buildChallenge(src: { songs?: unknown; choices?: unknown; mode?: unknown }, defi: number, previewOf: (i: number) => Promise<string | null>, now = Date.now()): Promise<{ token: string; rounds: QuizRound[] } | null> {
  if (!Array.isArray(src.songs) || !Array.isArray(src.choices) || src.songs.length !== src.choices.length || src.songs.length < 5) return null;
  const rounds: QuizRound[] = [], answers: number[] = [], songs: number[] = [];
  for (let r = 0; r < src.songs.length; r++) {
    const i = Number(src.songs[r]), choices = src.choices[r];
    const song = SONGS[i];
    if (!song || !Array.isArray(choices) || choices.length !== 4 || !choices.every((c) => typeof c === "string")) return null;
    const correct = choices.indexOf(song.anime);
    const preview = correct >= 0 ? await previewOf(i) : null;
    if (!preview) return null;
    rounds.push({ preview, choices: choices as string[] }); answers.push(correct); songs.push(i);
  }
  const mode: QuizMode = src.mode === "nostalgie" ? "nostalgie" : "generique";
  const key: QuizKey = { v: 1, nonce: randomUUID(), exp: now + 30 * 60_000, songs, answers, mode, choices: rounds.map((r) => r.choices), defi };
  return { token: signKey(key), rounds };
}

/** Points d'une manche : 100 si juste, + jusqu'à 50 selon la rapidité. */
export function roundPoints(ok: boolean, ms: number): number {
  if (!ok) return 0;
  const t = Math.min(Math.max(ms, 0), ROUND_MS);
  return POINTS + Math.round(SPEED_BONUS * (1 - t / ROUND_MS));
}

export function scoreQuiz(key: QuizKey, answers: QuizAnswer[], coverOf: (i: number) => string | null = () => null) {
  const correction: QuizCorrection[] = key.songs.map((si, r) => {
    const a = answers[r];
    const chosen = a && Number.isInteger(a.choice) && a.choice! >= 0 && a.choice! < 4 ? a.choice! : null;
    const ok = chosen === key.answers[r];
    const s = SONGS[si];
    return { anime: s.anime, title: s.title, artist: s.artist, kind: s.kind, cover: coverOf(si), correct: key.answers[r], chosen, ok, points: roundPoints(ok, Number(a?.ms) || ROUND_MS) };
  });
  return {
    score: correction.reduce((n, c) => n + c.points, 0),
    max: key.songs.length * (POINTS + SPEED_BONUS),
    good: correction.filter((c) => c.ok).length,
    correction,
  };
}
