import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "guilde_admin_session";
export const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;

// There is deliberately no default admin password. A short or missing value
// must never grant write access to the public deployment.
export const ADMIN_PASSWORD_MIN = 12;
export const ADMIN_SECRET_MIN = 32;

/**
 * Raison pour laquelle l'administration est désactivée, ou null si elle est
 * correctement configurée. Ne contient jamais la valeur des variables, seulement
 * leur nom et la règle non respectée (règles déjà publiques dans le dépôt).
 */
export function adminConfigIssue(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  const extraSecret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !password.trim()) return "la variable ADMIN_PASSWORD est absente de cet environnement";
  if (password === "1111") return "ADMIN_PASSWORD utilise l'ancienne valeur par défaut, qui n'est plus acceptée";
  if (password.trim().length < ADMIN_PASSWORD_MIN) return `ADMIN_PASSWORD doit compter au moins ${ADMIN_PASSWORD_MIN} caractères`;
  if (extraSecret && extraSecret.length < ADMIN_SECRET_MIN) return `ADMIN_SESSION_SECRET, si elle est définie, doit compter au moins ${ADMIN_SECRET_MIN} caractères`;
  return null;
}

export function isAdminConfigured(): boolean {
  return adminConfigIssue() === null;
}

function sessionKey(): Buffer | null {
  if (!isAdminConfigured()) return null;
  // A dedicated secret is recommended. Otherwise a strong ADMIN_PASSWORD is
  // domain-separated from the login comparison for signing purposes.
  return createHash("sha256")
    .update("guilde-admin-session-v1:")
    .update(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD!)
    .digest();
}

export function checkAdminPassword(candidate: unknown): boolean {
  if (!isAdminConfigured() || typeof candidate !== "string") return false;
  const expected = createHash("sha256").update(process.env.ADMIN_PASSWORD!).digest();
  const supplied = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expected, supplied);
}

function sign(payload: string, key: Buffer): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createAdminSession(now: number = Date.now()): string | null {
  const key = sessionKey();
  if (!key) return null;
  const expires = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE;
  const payload = `v1.${expires.toString(36)}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifyAdminSession(token: string | undefined, now: number = Date.now()): boolean {
  const key = sessionKey();
  if (!key || !token || token.length > 250) return false;
  const match = /^v1\.([0-9a-z]+)\.([A-Za-z0-9_-]{24})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;

  const expires = parseInt(match[1], 36);
  const current = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expires) || expires <= current || expires > current + ADMIN_SESSION_MAX_AGE) {
    return false;
  }

  const payload = token.slice(0, token.lastIndexOf("."));
  const supplied = Buffer.from(match[3], "base64url");
  const expected = Buffer.from(sign(payload, key), "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
