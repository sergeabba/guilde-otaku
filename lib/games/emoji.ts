// Quiz des émojis : un anime résumé en quelques émojis, 4 titres proposés.
// Énigmes de base (data/emoji-quiz.json) + énigmes validées dans l'admin. Module serveur.
import { randomUUID } from "node:crypto";
import base from "../../data/emoji-quiz.json";
import { hasJapanese } from "../member-extras";
import { emojiRows } from "./store";
import { sameTitle } from "./fuzzy";
import { LEVEL_MULT, type Level } from "./levels";
import { seal, shuffle, unseal } from "./token";

export const EMOJI_ROUNDS = 8;
export const EMOJI_MS = 20_000;
export interface Puzzle { id: string; emojis: string; answer: string; hint: string | null }
export interface EmojiKey { game: "emoji"; nonce: string; exp: number; ids: string[]; answers: number[]; level?: Level }
export interface EmojiAnswer { choice: number | null; ms: number; hint: boolean; text?: string }

export async function allPuzzles(): Promise<Puzzle[]> {
  const builtIn: Puzzle[] = (base as { emojis: string; answer: string; hint?: string }[]).map((p, i) => ({ id: `b${i}`, emojis: p.emojis, answer: p.answer, hint: p.hint ?? null }));
  const { rows } = await emojiRows("approved").catch(() => ({ rows: [] }));
  return [...builtIn, ...rows.map((r) => ({ id: `d${r.id}`, emojis: r.emojis, answer: r.answer, hint: r.hint }))];
}

/**
 * Partie de 8 énigmes. Expert : aucune proposition, le titre se tape (les suggestions
 * couvrent tous les titres du jeu, pour ne rien dévoiler).
 */
export function buildEmoji(puzzles: Puzzle[], now = Date.now(), rnd = Math.random, level?: Level) {
  const answers = [...new Set(puzzles.map((p) => p.answer))];
  const picked = shuffle(puzzles, rnd).filter((p, i, a) => a.findIndex((x) => x.answer === p.answer) === i).slice(0, EMOJI_ROUNDS);
  const typed = level === "expert";
  const rounds = picked.map((p) => {
    const choices = typed ? [] : shuffle([p.answer, ...shuffle(answers.filter((a) => a !== p.answer), rnd).slice(0, 3)], rnd);
    return { emojis: p.emojis, hint: p.hint, choices };
  });
  const key: EmojiKey = { game: "emoji", nonce: randomUUID(), exp: now + 30 * 60_000, ids: picked.map((p) => p.id), answers: rounds.map((r, i) => r.choices.indexOf(picked[i].answer)), ...(level ? { level } : {}) };
  return { token: seal(key), rounds, titles: typed ? [...answers].sort((a, b) => a.localeCompare(b, "fr")) : null };
}

export const openEmoji = (t: unknown) => unseal<EmojiKey>(t, "emoji");

/** 100 points (50 avec l'indice) + jusqu'à 50 de bonus de rapidité. */
export function emojiPoints(ok: boolean, ms: number, hint: boolean): number {
  if (!ok) return 0;
  const t = Math.min(Math.max(ms, 0), EMOJI_MS);
  return (hint ? 50 : 100) + Math.round(50 * (1 - t / EMOJI_MS));
}

export function scoreEmoji(key: EmojiKey, answers: EmojiAnswer[], puzzles: Puzzle[]) {
  const byId = new Map(puzzles.map((p) => [p.id, p]));
  const mult = key.level ? LEVEL_MULT[key.level] : 1;
  const correction = key.ids.map((id, r) => {
    const a = answers[r], p = byId.get(id);
    const chosen = Number.isInteger(a?.choice) && a!.choice! >= 0 && a!.choice! < 4 ? a!.choice! : null;
    const ok = key.level === "expert" ? !!a?.text && !!p && sameTitle(a.text, [p.answer]) : chosen === key.answers[r];
    // Facile : l'indice ne coûte rien.
    const hintCost = !!a?.hint && key.level !== "facile";
    return { emojis: p?.emojis ?? "?", answer: p?.answer ?? "?", ok, hint: !!a?.hint, points: Math.round(emojiPoints(ok, Number.isFinite(a?.ms) ? a!.ms : EMOJI_MS, hintCost) * mult) };
  });
  return { score: correction.reduce((n, c) => n + c.points, 0), max: Math.round(key.ids.length * 150 * mult), good: correction.filter((c) => c.ok).length, correction };
}

const PICTO = /\p{Extended_Pictographic}/gu;
/** Contrôle d'une énigme proposée : 2 à 8 émojis, rien d'autre ; titre en lettres latines. */
export function checkPuzzle(o: { emojis?: unknown; answer?: unknown; hint?: unknown }): { emojis: string; answer: string; hint: string | null } | string {
  const emojis = String(o.emojis ?? "").replace(/\s+/g, "").slice(0, 80);
  const count = emojis.match(PICTO)?.length ?? 0;
  // Après retrait des émojis et de leurs liants (ZWJ, sélecteurs, chiffres en touches, tons de peau), il ne doit rien rester.
  const rest = emojis.replace(PICTO, "").replace(/[‍️⃣\u{1F3FB}-\u{1F3FF}0-9#*]/gu, "");
  if (count < 2 || count > 8 || rest) return "L'énigme doit contenir de 2 à 8 émojis, sans texte.";
  const answer = String(o.answer ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
  if (answer.length < 2 || hasJapanese(answer)) return "Titre de l'anime invalide (lettres latines, 2 à 80 caractères).";
  const hint = String(o.hint ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
  if (hint && hasJapanese(hint)) return "Indice invalide (lettres latines).";
  return { emojis, answer, hint: hint || null };
}
