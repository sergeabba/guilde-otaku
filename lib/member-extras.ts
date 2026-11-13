// Données de profil enrichies d'un membre (colonne additive `fighters.extras`, JSON).
// Tout est facultatif : un membre sans extras garde exactement son affichage actuel.
// Le contenu vient de la base : il est validé et borné ici avant tout affichage.
import { isValidMusicId, type MusicProvider } from "./music";

export interface FocusPoint {
  /** 0 à 100, position horizontale du point focal en pourcentage */
  x: number;
  /** 0 à 100, position verticale du point focal en pourcentage */
  y: number;
}

export interface FavoriteWork {
  source: "anilist" | "manual";
  sourceId?: number;
  kind: "ANIME" | "MANGA";
  /** Titre en écriture japonaise : conservé pour l'enrichissement, JAMAIS affiché. */
  titleNative?: string;
  titleRomaji?: string;
  titleLocalized?: string;
  coverUrl?: string;
  sourceUrl?: string;
  rank?: number;
  featured?: boolean;
  personalNote?: string;
}

export interface MemberTrack {
  provider: MusicProvider;
  /** Identifiant propre au service (voir lib/music.ts) */
  id: string;
  title?: string;
  artist?: string;
}

/** Une distinction du palmarès (distincte du grade). */
export interface MemberAward {
  title: string;
  year?: number;
  description?: string;
}

export interface MemberExtras {
  displayNameRomaji?: string;
  favoriteAnime?: FavoriteWork[];
  favoriteManga?: FavoriteWork[];
  music?: MemberTrack[];
  awards?: MemberAward[];
  photoFocus?: FocusPoint;
  animeFocus?: FocusPoint;
}

const JAPANESE = /[　-〿぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;

/** Vrai si la chaîne contient des caractères japonais (kana ou kanji). */
export function hasJapanese(s: string): boolean {
  return JAPANESE.test(s);
}

/** Hôtes autorisés pour les jaquettes (images servies telles quelles). */
const COVER_HOSTS = ["s4.anilist.co", "img.anili.st"];
const SUPABASE_HOST = /\.supabase\.(co|in)$/;

const MAX_WORKS = 30;
const MAX_TRACKS = 10;
const MAX_AWARDS = 20;

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : undefined;
}

/** Texte destiné à l'affichage : rejeté s'il contient de l'écriture japonaise. */
function latinText(v: unknown, max: number): string | undefined {
  const t = str(v, max);
  return t && !hasJapanese(t) ? t : undefined;
}

function httpsUrl(v: unknown, hostOk?: (host: string) => boolean): string | undefined {
  const t = str(v, 600);
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return undefined;
    if (hostOk && !hostOk(u.hostname)) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

function focus(v: unknown): FocusPoint | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { x, y } = v as Record<string, unknown>;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  return { x: clamp(x), y: clamp(y) };
}

function work(v: unknown, kind: "ANIME" | "MANGA"): FavoriteWork | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const titleRomaji = latinText(o.titleRomaji, 200);
  const titleLocalized = latinText(o.titleLocalized, 200);
  // Une œuvre sans titre lisible en alphabet latin n'est pas affichable.
  if (!titleRomaji && !titleLocalized) return null;
  const sourceId = typeof o.sourceId === "number" && Number.isInteger(o.sourceId) && o.sourceId > 0 ? o.sourceId : undefined;
  return {
    source: o.source === "anilist" && sourceId ? "anilist" : "manual",
    sourceId,
    kind,
    titleNative: str(o.titleNative, 200),
    titleRomaji,
    titleLocalized,
    coverUrl: httpsUrl(o.coverUrl, (h) => COVER_HOSTS.includes(h) || SUPABASE_HOST.test(h)),
    sourceUrl: httpsUrl(o.sourceUrl),
    rank: typeof o.rank === "number" && Number.isFinite(o.rank) ? o.rank : undefined,
    featured: o.featured === true,
    personalNote: latinText(o.personalNote, 280),
  };
}

/** Clé de dédoublonnage : identifiant de source s'il existe, sinon titre normalisé. */
export function workKey(w: FavoriteWork): string {
  if (w.source === "anilist" && w.sourceId) return `anilist:${w.kind}:${w.sourceId}`;
  return `manual:${w.kind}:${(w.titleRomaji || w.titleLocalized || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`;
}

function works(v: unknown, kind: "ANIME" | "MANGA"): FavoriteWork[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const seen = new Set<string>();
  const out: FavoriteWork[] = [];
  for (const item of v.slice(0, MAX_WORKS * 2)) {
    const w = work(item, kind);
    if (!w) continue;
    const k = workKey(w);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
    if (out.length >= MAX_WORKS) break;
  }
  // Ordre choisi par le membre ; à rang égal, l'ordre de saisie.
  out.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  return out.length ? out : undefined;
}

function tracks(v: unknown): MemberTrack[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: MemberTrack[] = [];
  const seen = new Set<string>();
  for (const item of v.slice(0, MAX_TRACKS)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = str(o.id, 200);
    if (!id || !isValidMusicId(o.provider, id)) continue;
    const key = `${o.provider}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const t: MemberTrack = { provider: o.provider as MusicProvider, id };
    const title = latinText(o.title, 160), artist = latinText(o.artist, 120);
    if (title) t.title = title;
    if (artist) t.artist = artist;
    out.push(t);
  }
  return out.length ? out : undefined;
}

function awards(v: unknown): MemberAward[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: MemberAward[] = [];
  for (const item of v.slice(0, MAX_AWARDS)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = latinText(o.title, 80);
    if (!title) continue;
    const a: MemberAward = { title };
    const year = typeof o.year === "number" ? o.year : typeof o.year === "string" && /^\d{4}$/.test(o.year) ? Number(o.year) : NaN;
    if (Number.isInteger(year) && year >= 1990 && year <= 2100) a.year = year;
    const description = latinText(o.description, 240);
    if (description) a.description = description;
    out.push(a);
  }
  return out.length ? out : undefined;
}

/** Lit et valide la colonne `extras`. Toute valeur invalide est ignorée, jamais devinée. */
export function parseMemberExtras(raw: unknown): MemberExtras | undefined {
  let v = raw;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return undefined; }
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const extras: MemberExtras = {
    displayNameRomaji: latinText(o.displayNameRomaji, 80),
    favoriteAnime: works(o.favoriteAnime, "ANIME"),
    favoriteManga: works(o.favoriteManga, "MANGA"),
    music: tracks(o.music),
    awards: awards(o.awards),
    photoFocus: focus(o.photoFocus),
    animeFocus: focus(o.animeFocus),
  };
  const clean = Object.fromEntries(Object.entries(extras).filter(([, val]) => val !== undefined)) as MemberExtras;
  return Object.keys(clean).length ? clean : undefined;
}

/** Les coups de cœur : ceux marqués `featured`, sinon les premiers de la liste. Trois au plus. */
export function featuredWorks(list: FavoriteWork[] = [], max = 3): FavoriteWork[] {
  const flagged = list.filter((w) => w.featured);
  return (flagged.length ? flagged : list).slice(0, max);
}

/** Titre principal affichable (rōmaji vérifié, sinon titre localisé). */
export function workTitle(w: FavoriteWork): string {
  return w.titleRomaji || w.titleLocalized || "";
}

/** Sous-titre affichable s'il diffère du titre principal. */
export function workSubtitle(w: FavoriteWork): string | undefined {
  if (!w.titleRomaji || !w.titleLocalized) return undefined;
  return w.titleLocalized.toLowerCase() === w.titleRomaji.toLowerCase() ? undefined : w.titleLocalized;
}

/** `object-position` CSS à partir d'un point focal, avec un repli adapté aux portraits. */
export function objectPosition(f: FocusPoint | undefined, fallback = "50% 18%"): string {
  return f ? `${f.x}% ${f.y}%` : fallback;
}

/**
 * Palmarès affichable : les distinctions saisies dans l'admin, sinon l'ancienne
 * distinction unique (colonne `badge`). Rien n'est inventé.
 */
export function memberAwards(m: { badge?: string | null; extras?: MemberExtras | null }): MemberAward[] {
  if (m.extras?.awards?.length) return m.extras.awards;
  const legacy = m.badge?.trim();
  return legacy && !hasJapanese(legacy) ? [{ title: legacy }] : [];
}
