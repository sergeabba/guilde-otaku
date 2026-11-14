// MangaDex : mangas (et manhwa / manhua), avec titre et synopsis français quand ils existent.
// Règles MangaDex (docs « Limitations and Requirements ») :
// - en-tête User-Agent obligatoire et honnête ;
// - pas de CORS pour les autres sites : les requêtes passent par notre serveur ;
// - images servies de travers si appelées depuis un autre site : les couvertures
//   passent par notre proxy /api/works/cover ;
// - environ 5 requêtes par seconde au maximum.
import { frenchMangaSynopsis } from "./fr-synopsis";
import { hasJapanese } from "../member-extras";
import { WorkSearchError } from "./tmdb";
import type { WorkCandidate, WorkFormat } from "./types";

const API = "https://api.mangadex.org";
export const MANGADEX_UA = "GuildeOtaku/1.0 (+https://guilde-otaku.vercel.app)";
const DOUJINSHI_TAG = "b13b2a48-c720-44a9-9c77-39c9979373fb";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Espacement minimal entre deux appels depuis cette instance du serveur.
let last = 0;
async function politeFetch(url: string) {
  const wait = Math.max(0, last + 250 - Date.now());
  last = Date.now() + wait;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  const res = await fetch(url, { headers: { "User-Agent": MANGADEX_UA, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new WorkSearchError("MangaDex limite les recherches : réessaie dans une minute.", 503);
  if (!res.ok) throw new WorkSearchError(`MangaDex indisponible (${res.status}).`);
  return res.json();
}

type Loc = Record<string, string | undefined>;
interface MdManga {
  id: string;
  attributes: {
    title: Loc; altTitles?: Loc[]; description?: Loc; year?: number | null; status?: string | null;
    originalLanguage?: string; publicationDemographic?: string | null; lastChapter?: string | null;
    links?: Record<string, string> | null;
    tags?: { attributes?: { name?: Loc; group?: string } }[];
  };
  relationships?: { type: string; attributes?: { fileName?: string } }[];
}

const latin = (s?: string) => (s && !hasJapanese(s) ? s.replace(/\s+/g, " ").trim() : undefined);
const firstAlt = (m: MdManga, lang: string) => m.attributes.altTitles?.map((t) => t[lang]).find((v) => !!latin(v));
const STATUS: Record<string, string> = { ongoing: "En cours", completed: "Terminé", hiatus: "En pause", cancelled: "Arrêté" };

/** URL de couverture via notre proxy (taille 512 px de large). */
export function mangadexCover(id: string, fileName?: string) {
  if (!fileName || !UUID.test(id) || !/^[\w-]{1,80}\.(jpg|jpeg|png|webp)$/i.test(fileName)) return undefined;
  return `/api/works/cover?md=${id}/${encodeURIComponent(fileName)}`;
}

function format(lang?: string): WorkFormat {
  return lang === "ko" ? "MANHWA" : lang?.startsWith("zh") ? "MANHUA" : "MANGA";
}

function toCandidate(m: MdManga): WorkCandidate | null {
  const a = m.attributes;
  const titleEn = latin(a.title.en) ?? latin(firstAlt(m, "en"));
  const titleRomaji = latin(a.title["ja-ro"]) ?? latin(firstAlt(m, "ja-ro"));
  const titleFr = latin(a.title.fr) ?? latin(firstAlt(m, "fr"));
  // Titre principal : français seulement s'il est le titre principal MangaDex ; sinon anglais ou rōmaji.
  const title = latin(a.title.fr) ?? titleEn ?? titleRomaji ?? latin(Object.values(a.title)[0]);
  if (!title) return null;
  const fileName = m.relationships?.find((r) => r.type === "cover_art")?.attributes?.fileName;
  const al = Number(a.links?.al);
  const desc = (s?: string) => (s ? s.replace(/\[[^\]]*\]\([^)]*\)/g, "").replace(/---[\s\S]*$/, "").replace(/\s+/g, " ").trim().slice(0, 1200) || undefined : undefined);
  return {
    source: "mangadex",
    sourceId: m.id,
    kind: "MANGA",
    format: format(a.originalLanguage),
    title,
    titleFr,
    // Les titres alternatifs MangaDex sont saisis librement : à confirmer avant d'enregistrer.
    titleFrUnverified: titleFr ? !latin(a.title.fr) : undefined,
    titleRomaji,
    titleEn,
    year: typeof a.year === "number" ? a.year : undefined,
    synopsisFr: desc(a.description?.fr),
    synopsisEn: desc(a.description?.en),
    coverUrl: mangadexCover(m.id, fileName),
    sourceUrl: `https://mangadex.org/title/${m.id}`,
    genres: a.tags?.filter((t) => t.attributes?.group === "genre").map((t) => t.attributes?.name?.en).filter((g): g is string => !!g).slice(0, 5),
    status: a.status ? STATUS[a.status] ?? undefined : undefined,
    anilistId: Number.isSafeInteger(al) && al > 0 ? al : undefined,
  };
}

// « erotica » chez MangaDex = œuvres matures (Berserk, Vagabond) ; le contenu pornographique reste exclu.
const COMMON = "&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";

/** Recherche par titre : séries les plus suivies d'abord, sans doujinshi (œuvres de fans). */
export async function searchMangadex(query: string): Promise<WorkCandidate[]> {
  const url = `${API}/manga?title=${encodeURIComponent(query)}&limit=12&order[followedCount]=desc${COMMON}&excludedTags[]=${DOUJINSHI_TAG}`
    + "&originalLanguage[]=ja&originalLanguage[]=ko&originalLanguage[]=zh&originalLanguage[]=zh-hk";
  const json = await politeFetch(url);
  return ((json?.data ?? []) as MdManga[]).map(toCandidate).filter((c): c is WorkCandidate => !!c);
}

export async function mangadexDetail(id: string): Promise<WorkCandidate> {
  if (!UUID.test(id)) throw new WorkSearchError("Identifiant MangaDex invalide.", 400);
  const json = await politeFetch(`${API}/manga/${id}?includes[]=cover_art`);
  const c = json?.data ? toCandidate(json.data as MdManga) : null;
  if (!c) throw new WorkSearchError("Œuvre introuvable sur MangaDex.", 404);
  // Pas de description française sur MangaDex : Wikipédia FR, puis l'adaptation animée (TMDB).
  if (!c.synopsisFr) {
    const fr = await frenchMangaSynopsis([c.titleFr && !c.titleFrUnverified ? c.titleFr : "", c.title, c.titleEn ?? "", c.titleRomaji ?? ""]).catch(() => null);
    if (fr) { c.synopsisFr = fr.text; c.synopsisCredit = fr.credit; }
  }
  return c;
}

/** Télécharge une couverture MangaDex (pour le proxy). Taille 512 px, ou 256 px. */
export async function fetchMangadexCover(id: string, fileName: string, size: 256 | 512 = 512) {
  if (!UUID.test(id) || !/^[\w-]{1,80}\.(jpg|jpeg|png|webp)$/i.test(fileName)) throw new WorkSearchError("Couverture invalide.", 400);
  const res = await fetch(`https://uploads.mangadex.org/covers/${id}/${fileName}.${size}.jpg`, {
    headers: { "User-Agent": MANGADEX_UA, Accept: "image/*" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new WorkSearchError(`Couverture indisponible (${res.status}).`, res.status === 404 ? 404 : 502);
  return res;
}
