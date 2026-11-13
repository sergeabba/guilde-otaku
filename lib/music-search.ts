// Recherche de musique pour l'admin, sans clé secrète :
// - recherche par texte : API publique iTunes Search (catalogue Apple Music) ;
// - lien collé : oEmbed officiel de Spotify et de YouTube, recherche iTunes par
//   identifiant pour Apple Music.
// Rien n'est deviné : seules les valeurs renvoyées par ces services sont proposées,
// et l'admin choisit puis corrige avant d'enregistrer.
import { parseMusicLink, type MusicRef } from "./music";

export interface MusicCandidate extends MusicRef {
  title?: string;
  artist?: string;
  album?: string;
  cover?: string;
  /** Extrait audio fourni par Apple (30 s), pour écouter avant de choisir. */
  previewUrl?: string;
  source: "itunes" | "spotify-oembed" | "youtube-oembed";
}

/** Hôtes autorisés pour les pochettes (images renvoyées par les services eux-mêmes). */
const COVER_HOST = /^(is\d+-ssl\.mzstatic\.com|i\.scdn\.co|image-cdn-[\w-]+\.spotifycdn\.com|i\.ytimg\.com)$/;

export function safeCover(u: unknown): string | undefined {
  if (typeof u !== "string" || u.length > 500) return undefined;
  try {
    const url = new URL(u);
    return url.protocol === "https:" && COVER_HOST.test(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** Résultats iTunes Search (entity=song) vers candidats Apple Music. */
export function itunesToCandidates(json: unknown): MusicCandidate[] {
  const results = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  const out: MusicCandidate[] = [];
  for (const r of results) {
    const o = r as Record<string, unknown>;
    if (o.kind !== "song" || typeof o.trackViewUrl !== "string") continue;
    const ref = parseMusicLink(o.trackViewUrl);
    if (!ref || ref.provider !== "apple") continue;
    const art = typeof o.artworkUrl100 === "string" ? o.artworkUrl100.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/600x600bb.$1") : undefined;
    out.push({
      ...ref, source: "itunes",
      title: text(o.trackName, 160), artist: text(o.artistName, 120), album: text(o.collectionName, 160),
      cover: safeCover(art) ?? safeCover(o.artworkUrl100),
      previewUrl: typeof o.previewUrl === "string" && /^https:\/\/audio-ssl\.itunes\.apple\.com\//.test(o.previewUrl) ? o.previewUrl : undefined,
    });
  }
  return out;
}

/** Réponse oEmbed (Spotify ou YouTube) vers candidat. */
export function oembedToCandidate(ref: MusicRef, json: unknown): MusicCandidate | null {
  const o = json as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  if (ref.provider === "spotify") {
    return { ...ref, source: "spotify-oembed", title: text(o.title, 160), cover: safeCover(o.thumbnail_url) };
  }
  if (ref.provider === "youtube") {
    // La chaîne YouTube n'est pas toujours l'artiste : proposée, à vérifier par l'admin.
    const channel = text(o.author_name, 120)?.replace(/\s*-\s*Topic$/i, "");
    return { ...ref, source: "youtube-oembed", title: text(o.title, 160), artist: channel, cover: safeCover(o.thumbnail_url) };
  }
  return null;
}

/** Liens de recherche (pas de lien de morceau inventé) pour retrouver le même titre ailleurs. */
export function searchLinks(q: string): { spotify: string; youtube: string; apple: string } {
  const s = encodeURIComponent(q.trim().slice(0, 120));
  return {
    spotify: `https://open.spotify.com/search/${s}`,
    youtube: `https://www.youtube.com/results?search_query=${s}`,
    apple: `https://music.apple.com/fr/search?term=${s}`,
  };
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (res.status === 429 || res.status === 403) throw new Error("Le service limite les recherches : réessaie dans une minute.");
  if (!res.ok) throw new Error(`Service indisponible (${res.status}).`);
  return res.json();
}

/** Recherche texte dans le catalogue Apple Music (vitrine française). */
export async function searchItunes(query: string): Promise<MusicCandidate[]> {
  const term = encodeURIComponent(query.trim().slice(0, 100));
  return itunesToCandidates(await getJson(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=10&country=fr`));
}

/** Informations d'un lien collé. */
export async function lookupLink(url: string): Promise<MusicCandidate | null> {
  const ref = parseMusicLink(url);
  if (!ref) return null;
  if (ref.provider === "spotify") return oembedToCandidate(ref, await getJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${ref.id}`)}`));
  if (ref.provider === "youtube") return oembedToCandidate(ref, await getJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${ref.id}`)}`));
  // Apple Music : identifiant du morceau (?i=) ou de la chanson (/song/<id>)
  const m = /[?&]i=(\d+)/.exec(ref.id) ?? /\/song\/[^/]+\/(\d+)/.exec(ref.id);
  if (!m) return { ...ref, source: "itunes" };
  const country = ref.id.slice(0, 2);
  const found = itunesToCandidates(await getJson(`https://itunes.apple.com/lookup?id=${m[1]}&country=${country}&entity=song`));
  // On garde le lien collé par l'admin (même morceau, même vitrine).
  return found[0] ? { ...found[0], ...ref } : { ...ref, source: "itunes" };
}
