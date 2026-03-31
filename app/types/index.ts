// ─── app/types/index.ts ────────────────────────────────────────────────────────
// Fichier de types partagés pour toute l'application Guilde Otaku.
// Évite les définitions multiples et incohérentes.

// ─── VIEW MODE ────────────────────────────────────────────────────────────────
export type ViewMode = "real" | "anime";

// ─── PARSE BIRTHDAY ───────────────────────────────────────────────────────────
// Parses "12 mars", "3 août", etc. → { day, month }
// Centralisé ici pour éviter la duplication dans BirthdayBanner et birthdays/page.

const MONTH_MAP: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2,
  mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8,
  septembre: 9, octobre: 10, novembre: 11,
  décembre: 12, decembre: 12,
};

export function parseBirthday(birthday: string): { day: number; month: number } | null {
  const parts = birthday.trim().toLowerCase().split(" ");
  if (parts.length < 2) return null;
  const day   = parseInt(parts[0]);
  const month = MONTH_MAP[parts[1]];
  if (!day || !month) return null;
  return { day, month };
}
