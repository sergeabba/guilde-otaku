// Jetons signés (HMAC) des jeux : le corrigé voyage avec la partie sans jamais être
// lisible ni modifiable par le navigateur. Module serveur.
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.GAME_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Jeux non configurés sur le serveur.");
  return s;
}
const mac = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

/** Étiquette courte et opaque d'une valeur (ne révèle rien au navigateur). */
export const tag = (v: string) => mac(`tag:${v}`).slice(0, 8);

export function seal(obj: object): string {
  const body = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${body}.${mac(body)}`;
}

/** Contenu du jeton s'il est intact, du bon jeu et non expiré ; null sinon. */
export function unseal<T extends { exp: number; game?: string }>(token: unknown, game?: string, now = Date.now()): T | null {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = mac(body);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const o = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    if (!(o.exp > now)) return null;
    if (game && o.game !== game) return null;
    return o;
  } catch { return null; }
}

export const shuffle = <T,>(a: readonly T[], rnd: () => number = Math.random): T[] => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
};

/** Générateur pseudo-aléatoire déterministe (même graine, même tirage : défi du jour). */
export function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
