// Liens musicaux des membres.
// Lecture : YouTube (morceau complet pour tout le monde, sans compte) en priorité,
// Spotify accepté (extrait de 30 s sans compte). Apple Music n'est plus proposé :
// les anciens liens restent lisibles en base mais ne sont plus joués sur le site
// (lien de recherche YouTube à la place). Seuls les lecteurs officiels sont
// utilisés, et uniquement après un appui du visiteur.

export type MusicProvider = "youtube" | "spotify" | "apple";

export interface MusicRef {
  provider: MusicProvider;
  /** YouTube : identifiant vidéo. Spotify : "track/<id>" ou "album/<id>". Apple : chemin "fr/album/nom/123?i=456". */
  id: string;
}

const SPOTIFY_KINDS = ["track", "album", "playlist"] as const;
const APPLE_KINDS = ["album", "song", "playlist"] as const;

function youtube(u: URL): string | null {
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") { const id = u.pathname.slice(1); return /^[\w-]{11}$/.test(id) ? id : null; }
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = /^\/(?:shorts|embed|live)\/([\w-]{11})/.exec(u.pathname);
    if (m) return m[1];
  }
  return null;
}

function spotify(u: URL): string | null {
  if (u.hostname !== "open.spotify.com") return null;
  // /track/<id>, /intl-fr/track/<id>, /embed/track/<id>
  const parts = u.pathname.split("/").filter(Boolean).filter((p) => !/^intl-[a-z-]+$/i.test(p) && p !== "embed");
  const [kind, id] = parts;
  if (!(SPOTIFY_KINDS as readonly string[]).includes(kind) || !/^[A-Za-z0-9]{22}$/.test(id ?? "")) return null;
  return `${kind}/${id}`;
}

function apple(u: URL): string | null {
  if (u.hostname !== "music.apple.com" && u.hostname !== "embed.music.apple.com") return null;
  // /<pays>/<album|song|playlist>/<nom>/<id>[?i=<piste>]
  const parts = u.pathname.split("/").filter(Boolean);
  const [cc, kind, slug, id] = parts;
  if (!/^[a-z]{2}$/.test(cc ?? "") || !(APPLE_KINDS as readonly string[]).includes(kind) || !slug || !id) return null;
  if (!/^[\w%.-]{1,120}$/.test(slug) || !/^(\d{1,15}|pl\.[\w-]{1,64})$/.test(id)) return null;
  const track = u.searchParams.get("i");
  if (track !== null && !/^\d{1,15}$/.test(track)) return null;
  return `${cc}/${kind}/${slug}/${id}${track ? `?i=${track}` : ""}`;
}

/** Reconnaît un lien partagé depuis l'application ou le site du service. */
export function parseMusicLink(input: string): MusicRef | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return { provider: "youtube", id: s };
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const y = youtube(u); if (y) return { provider: "youtube", id: y };
  const sp = spotify(u); if (sp) return { provider: "spotify", id: sp };
  const ap = apple(u); if (ap) return { provider: "apple", id: ap };
  return null;
}

/** Valide un identifiant déjà enregistré (données venant de la base). */
export function isValidMusicId(provider: unknown, id: unknown): provider is MusicProvider {
  if (typeof id !== "string") return false;
  if (provider === "youtube") return /^[\w-]{11}$/.test(id);
  if (provider === "spotify") return /^(track|album|playlist)\/[A-Za-z0-9]{22}$/.test(id);
  if (provider === "apple") return apple(new URL(`https://music.apple.com/${id}`)) === id;
  return false;
}

export function embedUrl(t: MusicRef): string {
  if (t.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${t.id}?autoplay=1&rel=0`;
  if (t.provider === "spotify") return `https://open.spotify.com/embed/${t.id}?utm_source=generator`;
  return `https://embed.music.apple.com/${t.id}`;
}

export function openUrl(t: MusicRef): string {
  if (t.provider === "youtube") return `https://www.youtube.com/watch?v=${t.id}`;
  if (t.provider === "spotify") return `https://open.spotify.com/${t.id}`;
  return `https://music.apple.com/${t.id}`;
}

/** Plateformes jouées dans le lecteur flottant du site. */
export const PLAYABLE: MusicProvider[] = ["youtube", "spotify"];
export const isPlayable = (t: MusicRef) => PLAYABLE.includes(t.provider);

/** Recherche YouTube du même titre (aucun lien de morceau inventé). */
export function youtubeSearchUrl(t: { title?: string; artist?: string }): string | null {
  const q = [t.artist, t.title].filter(Boolean).join(" ").trim();
  return q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q.slice(0, 120))}` : null;
}

export const PROVIDER_LABEL: Record<MusicProvider, string> = { youtube: "YouTube", spotify: "Spotify", apple: "Apple Music" };

/** Ce que le visiteur entendra, selon la plateforme (à afficher près du lecteur). */
export const PROVIDER_LIMIT: Record<MusicProvider, string> = {
  youtube: "Lecture complète, avec publicités possibles.",
  spotify: "Extrait de 30 secondes, ou morceau complet si tu es connecté à Spotify dans ce navigateur.",
  apple: "Apple Music n'est plus lu sur le site : écoute ce titre sur YouTube.",
};

/** Hauteur du lecteur intégré officiel. */
export const EMBED_HEIGHT: Record<MusicProvider, number> = { youtube: 0, spotify: 152, apple: 175 };
