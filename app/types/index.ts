// ─── app/types/index.ts ────────────────────────────────────────────────────────
// Fichier de types partagés pour toute l'application Guilde Otaku.
// Source unique de vérité pour tous les types — évite les définitions multiples.

// ─── VIEW MODE ────────────────────────────────────────────────────────────────
export type ViewMode = "real" | "anime";

// ─── FIGHTER STATS ────────────────────────────────────────────────────────────
export interface FighterStats {
  force:     number; // 0–100
  vitesse:   number; // 0–100
  technique: number; // 0–100
}

// ─── SPECIAL ATTACK ───────────────────────────────────────────────────────────
export interface SpecialAttack {
  name:   string;
  effect: string;
}

// ─── SUPABASE RAW ROW (table fighters) ───────────────────────────────────────
// Représente une ligne brute telle que retournée par Supabase.
export interface SupabaseMemberRow {
  id:        number;
  name:      string;
  rank:      string;
  birthday:  string;
  bio:       string;
  photo:     string;
  animechar: string;
  color:     string;
  badge?:    string | null;
  rankjp?:   string | null;
  stats?:    FighterStats | null;
  special?:  SpecialAttack | null;
}

// ─── BIBLIOTHÈQUE ENTRY ───────────────────────────────────────────────────────
export type BiblioTier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";
export type BiblioCategory = "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";

export interface BiblioEntry {
  id:          number | string;
  title:       string;
  category:    BiblioCategory;
  tier:        BiblioTier;
  year?:       number;
  cover_image: string;
  status:      string;
  note:        number | string;
  synopsis?:   string;
  avis_guilde?: string;
  trailer_url?: string;
  created_at?: string;
}

// ─── SUPABASE RAW ROW (table bibliotheque) ────────────────────────────────────
export interface SupabaseBiblioRow {
  id:          number;
  title:       string;
  type?:       string;
  tier?:       string;
  score?:      number;
  synopsis?:   string;
  avis_guilde?: string;
  cover_image?: string;
  trailer_url?: string;
  status?:     string;
  year?:       number;
  created_at:  string;
}

// ─── ATELIER ITEM ─────────────────────────────────────────────────────────────
export type AtelierCategory = "Création" | "Portrait" | "Scène" | "VFX";
export type AtelierSize = "cell-large" | "cell-tall" | "cell-wide" | "cell-normal";

export interface AtelierItem {
  id:          number | string;
  filename:    string;
  url:         string;
  title:       string;
  description?: string;
  prompt?:     string;
  category:    AtelierCategory;
  universe?:   string;
  accent?:     string;
  size:        AtelierSize;
}

// ─── SUPABASE RAW ROW (table atelier) ────────────────────────────────────────
export interface SupabaseAtelierRow {
  id:             number;
  filename:       string;
  url:            string;
  title:          string;
  description?:   string;
  prompt?:        string;
  category?:      string;
  universe?:      string;
  accent?:        string;
  size?:          string;
  has_db_record?: boolean;
}

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
  if (!birthday || typeof birthday !== "string") return null;
  const parts = birthday.trim().toLowerCase().split(" ");
  if (parts.length < 2) return null;
  const day   = parseInt(parts[0], 10);
  const month = MONTH_MAP[parts[1]];
  if (!day || !month || isNaN(day)) return null;
  return { day, month };
}

// ─── GET DAYS UNTIL ───────────────────────────────────────────────────────────
// Calcule le nombre de jours jusqu'au prochain anniversaire.
export function getDaysUntil(birthday: string): number {
  const parsed = parseBirthday(birthday);
  if (!parsed) return Infinity;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next    = new Date(now.getFullYear(), parsed.month - 1, parsed.day);

  if (next < today) {
    next = new Date(now.getFullYear() + 1, parsed.month - 1, parsed.day);
  }

  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── IS TODAY BIRTHDAY ────────────────────────────────────────────────────────
export function isTodayBirthday(birthday: string): boolean {
  const parsed = parseBirthday(birthday);
  if (!parsed) return false;
  const now = new Date();
  return parsed.day === now.getDate() && parsed.month === now.getMonth() + 1;
}

// ─── FORMAT BIRTHDAY DISPLAY ─────────────────────────────────────────────────
export function formatBirthdayDisplay(birthday: string): string {
  const parsed = parseBirthday(birthday);
  if (!parsed) return birthday;
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  return `${parsed.day} ${months[parsed.month - 1]}`;
}
