// Données de profil enrichies d'un membre (colonne additive `fighters.extras`, JSON).
// Tout est facultatif : un membre sans extras garde exactement son affichage actuel.
// Le contenu vient de la base : il est validé et borné ici avant tout affichage.
import { isValidMusicId, type MusicProvider } from "./music";
import { safeCover } from "./music-search";

export interface FocusPoint {
  /** 0 à 100, position horizontale du point focal en pourcentage */
  x: number;
  /** 0 à 100, position verticale du point focal en pourcentage */
  y: number;
}

export interface FavoriteWork {
  /** anilist : anciens favoris (conservés tels quels). tmdb / mangadex : recherche française actuelle. */
  source: "anilist" | "manual" | "tmdb" | "mangadex";
  /** AniList : nombre. TMDB : « tv:123 » ou « movie:123 ». MangaDex : UUID. */
  sourceId?: number | string;
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
  /** Court synopsis en français (saisi ou repris de la Bibliothèque, jamais traduit automatiquement). */
  synopsis?: string;
  /** Origine du synopsis : « source » (texte français de TMDB/MangaDex) ou « manual » (écrit à la main, jamais remplacé). */
  synopsisSource?: "source" | "manual";
  /** Crédit du synopsis repris d'ailleurs (Wikipédia : licence CC BY-SA, lien obligatoire). */
  synopsisCredit?: { label: string; url: string };
  /** Forme de l'œuvre : série, film, manga… (voir lib/works/types). */
  format?: "SERIE" | "FILM" | "MANGA" | "MANHWA" | "MANHUA";
  year?: number;
  genres?: string[];
  /** Bande-annonce YouTube (langue d'origine indiquée). */
  trailer?: { youtubeId: string; lang?: string };
  /** Identifiant AniList connu de la source : évite les doublons avec les anciens favoris. */
  anilistId?: number;
}

export interface MemberTrack {
  provider: MusicProvider;
  /** Identifiant propre au service (voir lib/music.ts) */
  id: string;
  title?: string;
  artist?: string;
  album?: string;
  /** Pochette renvoyée par le service (Apple, Spotify, YouTube). */
  cover?: string;
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
  /** Personnalisation de la carte téléchargeable (couleur forcée, motif de fond). */
  card?: CardStyle;
}

export const CARD_MOTIFS = ["points", "vitesse", "trame", "rayons"] as const;
export type CardMotif = (typeof CARD_MOTIFS)[number];
export const CARD_MOTIF_LABEL: Record<CardMotif, string> = { points: "Points", vitesse: "Lignes de vitesse", trame: "Trame manga", rayons: "Rayons" };
export interface CardStyle { color?: string; motif?: CardMotif }

const JAPANESE = /[　-〿぀-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;

/** Vrai si la chaîne contient des caractères japonais (kana ou kanji). */
export function hasJapanese(s: string): boolean {
  return JAPANESE.test(s);
}

/** Hôtes autorisés pour les jaquettes (images servies telles quelles). */
const COVER_HOSTS = ["s4.anilist.co", "img.anili.st", "image.tmdb.org"];
/** Couverture MangaDex servie par notre proxy (chemin relatif du site). */
const LOCAL_COVER = /^\/api\/works\/cover\?md=[0-9a-f-]{36}\/[\w%.-]{1,100}$/i;
const FORMATS = ["SERIE", "FILM", "MANGA", "MANHWA", "MANHUA"] as const;
const SUPABASE_HOST = /\.supabase\.(co|in)$/;

const MAX_WORKS = 30;
/** Rubriques de `extras` gérées par l'admin (toute autre clé est conservée telle quelle). */
export const EXTRAS_KEYS = ["displayNameRomaji", "favoriteAnime", "favoriteManga", "music", "awards", "photoFocus", "animeFocus", "card"] as const;

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

function cardStyle(v: unknown): CardStyle | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const color = typeof o.color === "string" && /^#[0-9a-f]{6}$/i.test(o.color) ? o.color.toLowerCase() : undefined;
  const motif = CARD_MOTIFS.find((m) => m === o.motif);
  return color || motif ? { ...(color && { color }), ...(motif && { motif }) } : undefined;
}

function work(v: unknown, kind: "ANIME" | "MANGA"): FavoriteWork | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const titleRomaji = latinText(o.titleRomaji, 200);
  const titleLocalized = latinText(o.titleLocalized, 200);
  // Une œuvre sans titre lisible en alphabet latin n'est pas affichable.
  if (!titleRomaji && !titleLocalized) return null;
  const numId = typeof o.sourceId === "number" && Number.isInteger(o.sourceId) && o.sourceId > 0 ? o.sourceId : undefined;
  const strId = typeof o.sourceId === "string" ? o.sourceId : undefined;
  let source: FavoriteWork["source"] = "manual";
  let sourceId: FavoriteWork["sourceId"];
  if (o.source === "anilist" && numId) { source = "anilist"; sourceId = numId; }
  else if (o.source === "tmdb" && strId && /^(tv|movie):\d{1,10}$/.test(strId)) { source = "tmdb"; sourceId = strId; }
  else if (o.source === "mangadex" && strId && /^[0-9a-f-]{36}$/i.test(strId)) { source = "mangadex"; sourceId = strId; }
  const coverRaw = str(o.coverUrl, 600);
  const synopsis = latinText(o.synopsis, 700);
  const year = typeof o.year === "number" && Number.isInteger(o.year) && o.year > 1900 && o.year < 2100 ? o.year : undefined;
  const t = o.trailer && typeof o.trailer === "object" ? (o.trailer as Record<string, unknown>) : undefined;
  const trailerId = t && typeof t.youtubeId === "string" && /^[\w-]{11}$/.test(t.youtubeId) ? t.youtubeId : undefined;
  const al = typeof o.anilistId === "number" && Number.isInteger(o.anilistId) && o.anilistId > 0 ? o.anilistId : undefined;
  const genres = Array.isArray(o.genres) ? o.genres.map((g) => latinText(g, 40)).filter((g): g is string => !!g).slice(0, 5) : undefined;
  const w: FavoriteWork = {
    source,
    sourceId,
    kind,
    titleNative: str(o.titleNative, 200),
    titleRomaji,
    titleLocalized,
    coverUrl: coverRaw && LOCAL_COVER.test(coverRaw) ? coverRaw : httpsUrl(o.coverUrl, (h) => COVER_HOSTS.includes(h) || SUPABASE_HOST.test(h)),
    sourceUrl: httpsUrl(o.sourceUrl),
    rank: typeof o.rank === "number" && Number.isFinite(o.rank) ? o.rank : undefined,
    featured: o.featured === true,
    personalNote: latinText(o.personalNote, 280),
    synopsis,
  };
  if (synopsis && (o.synopsisSource === "source" || o.synopsisSource === "manual")) w.synopsisSource = o.synopsisSource;
  const cr = o.synopsisCredit as Record<string, unknown> | undefined;
  const crLabel = cr && typeof cr === "object" ? latinText(cr.label, 80) : undefined;
  const crUrl = cr && typeof cr === "object" ? httpsUrl(cr.url, (h) => h === "fr.wikipedia.org" || h === "www.themoviedb.org") : undefined;
  if (synopsis && w.synopsisSource === "source" && crLabel && crUrl) w.synopsisCredit = { label: crLabel, url: crUrl };
  if (typeof o.format === "string" && (FORMATS as readonly string[]).includes(o.format)) w.format = o.format as FavoriteWork["format"];
  if (year) w.year = year;
  if (genres?.length) w.genres = genres;
  if (trailerId) w.trailer = { youtubeId: trailerId, ...(t && typeof t.lang === "string" && /^[a-z]{2}$/.test(t.lang) ? { lang: t.lang } : {}) };
  if (al) w.anilistId = al;
  return w;
}

/** Clé de dédoublonnage : identifiant de source s'il existe, sinon titre normalisé. */
export function workKey(w: FavoriteWork): string {
  if (w.source === "anilist" && w.sourceId) return `anilist:${w.kind}:${w.sourceId}`;
  if ((w.source === "tmdb" || w.source === "mangadex") && w.sourceId) return `${w.source}:${w.kind}:${w.sourceId}`;
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
    const title = latinText(o.title, 160), artist = latinText(o.artist, 120), album = latinText(o.album, 160);
    if (title) t.title = title;
    if (artist) t.artist = artist;
    if (album) t.album = album;
    const cover = safeCover(o.cover);
    if (cover) t.cover = cover;
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
    card: cardStyle(o.card),
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
/** Œuvres issues de la recherche française : le titre localisé (français) passe en premier. */
const frenchFirst = (w: FavoriteWork) => w.source === "tmdb" || w.source === "mangadex";

export function workTitle(w: FavoriteWork): string {
  return frenchFirst(w) ? w.titleLocalized || w.titleRomaji || "" : w.titleRomaji || w.titleLocalized || "";
}

/** Sous-titre affichable s'il diffère du titre principal. */
export function workSubtitle(w: FavoriteWork): string | undefined {
  if (!w.titleRomaji || !w.titleLocalized) return undefined;
  if (w.titleLocalized.toLowerCase() === w.titleRomaji.toLowerCase()) return undefined;
  return frenchFirst(w) ? w.titleRomaji : w.titleLocalized;
}

/** Vrai si deux favoris désignent la même œuvre (y compris ancien favori AniList et MangaDex). */
export function sameWork(a: FavoriteWork, b: FavoriteWork): boolean {
  if (workKey(a) === workKey(b)) return true;
  if (a.kind !== b.kind) return false;
  const alA = a.source === "anilist" ? Number(a.sourceId) : a.anilistId;
  const alB = b.source === "anilist" ? Number(b.sourceId) : b.anilistId;
  if (alA && alA === alB) return true;
  // Saisie manuelle : pas d'identifiant, on compare les titres connus.
  if (a.source === "manual" || b.source === "manual") {
    const titles = (w: FavoriteWork) => new Set([w.titleRomaji, w.titleLocalized].filter(Boolean).map((t) => t!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()));
    const ta = titles(a);
    return [...titles(b)].some((t) => t && ta.has(t));
  }
  return false;
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
