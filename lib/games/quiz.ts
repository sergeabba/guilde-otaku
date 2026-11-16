// Quiz des génériques : 10 extraits d'openings/endings, 4 animes proposés à chaque fois.
// Le corrigé ne quitte jamais le serveur en clair : il voyage dans un jeton signé (HMAC),
// et le score est calculé ici. Module serveur.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import catalog from "../../data/anime-songs.json";
import type { CatalogSong } from "../anime-song";

export const QUIZ_ROUNDS = 10;
export const ROUND_MS = 20_000;
const POINTS = 100, SPEED_BONUS = 50;
const SONGS = catalog as CatalogSong[];

export interface QuizRound { preview: string; choices: string[] }
export interface QuizKey { v: 1; nonce: string; exp: number; songs: number[]; answers: number[] }
export interface QuizAnswer { choice: number | null; ms: number }
export interface QuizCorrection { anime: string; title: string; artist: string; kind: "OP" | "ED"; cover: string | null; correct: number; chosen: number | null; ok: boolean; points: number }

function secret(): string {
  const s = process.env.GAME_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Jeux non configurés sur le serveur.");
  return s;
}
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function signKey(key: QuizKey): string {
  const body = b64(JSON.stringify(key));
  return `${body}.${sign(body)}`;
}

export function verifyKey(token: string, now = Date.now()): QuizKey | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const key = JSON.parse(Buffer.from(body, "base64url").toString()) as QuizKey;
    return key.v === 1 && key.exp > now ? key : null;
  } catch { return null; }
}

const shuffle = <T,>(a: T[], rnd = Math.random) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

/**
 * Tire les questions. `previewOf` donne l'extrait d'un titre (null : titre écarté).
 * Les trois mauvaises réponses sont d'autres animes du catalogue.
 */
export async function buildQuiz(previewOf: (i: number) => Promise<string | null>, now = Date.now()): Promise<{ token: string; rounds: QuizRound[] }> {
  const animes = [...new Set(SONGS.map((s) => s.anime))];
  const picked: { i: number; preview: string }[] = [];
  const usedAnime = new Set<string>();
  for (const i of shuffle(SONGS.map((_, k) => k))) {
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
  const key: QuizKey = { v: 1, nonce: randomUUID(), exp: now + 30 * 60_000, songs: picked.map((p) => p.i), answers };
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
