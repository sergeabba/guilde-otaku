// Extraits de voix des seiyuu pour le jeu « La voix » : aperçus de 30 secondes de l'API
// iTunes Search (les mêmes que le blind test), choisis parmi les chansons interprétées
// par le doubleur, de préférence dans le rôle du personnage (« Eren Yeager (CV: Kaji Yuuki) »).
// Seule l'adresse de l'aperçu part vers le navigateur : ni titre ni artiste, rien qui trahisse la réponse.
import { unstable_cache } from "next/cache";

export interface ItunesTrack { artistName?: string; trackName?: string; previewUrl?: string; kind?: string }
export interface VoiceClip { url: string; inRole: boolean }

/** Sans espaces ni ponctuation japonaise : « Kaji Yuuki » écrit avec ou sans espace se vaut. */
const squash = (s: string) => s.normalize("NFKC").replace(/[\s\u30FB·.=\uFF1D()\uFF08\uFF09\[\]\u3010\u3011:\uFF1A]/g, "").toLowerCase();
/** Plusieurs interprètes (duo, groupe) : on écarte, la voix ne serait pas isolée. */
const isGroup = (artist: string) => /[\u3001,&×\uFF06/]|feat|with|\bx\b/i.test(artist) || (artist.match(/CV/gi)?.length ?? 0) > 1;
const NOT_VOICE = /instrumental|off ?vocal|karaoke|\u30AB\u30E9\u30AA\u30B1|\u30AA\u30EA\u30B8\u30CA\u30EB\u30FB\u30AB\u30E9\u30AA\u30B1|inst\.|bgm/i;

/**
 * Meilleur extrait parmi des résultats iTunes : 1) chanson dans le rôle du personnage,
 * 2) chanson du doubleur sous son nom, 3) chanson dans un autre rôle. Null si aucune.
 */
export function pickVoiceClip(results: ItunesTrack[], voiceNative: string, charNative?: string | null): VoiceClip | null {
  const va = squash(voiceNative);
  if (va.length < 2) return null;
  const ch = charNative ? squash(charNative) : "";
  // Le personnage est souvent crédité par son seul prénom ou nom : un des deux suffit.
  const chParts = charNative ? charNative.split(/[\s\u30FB·]+/).map(squash).filter((x) => x.length >= 2) : [];
  let self: VoiceClip | null = null, other: VoiceClip | null = null;
  for (const r of results) {
    const a = r.artistName ?? "", url = r.previewUrl;
    if (!url || (r.kind && r.kind !== "song") || NOT_VOICE.test(r.trackName ?? "") || isGroup(a)) continue;
    const sa = squash(a);
    if (!sa.includes(va)) continue;
    const role = sa.replace(va, "");
    if (ch && (role.includes(ch) || chParts.some((p) => role.includes(p)))) return { url, inRole: true };
    if (sa === va) self ??= { url, inRole: false };
    else other ??= { url, inRole: false };
  }
  return self ?? other;
}

/** Chansons iTunes d'un doubleur pour une recherche donnée (gardées 30 jours). */
const tracksOf = (voiceNative: string, term = voiceNative) => unstable_cache(async (): Promise<ItunesTrack[]> => {
  const res = await fetch(`https://itunes.apple.com/search?${new URLSearchParams({ term, entity: "song", country: "JP", limit: "200" })}`, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const va = squash(voiceNative);
  // On ne garde que l'utile : ses chansons à lui ou elle, en solo.
  return (((await res.json()) as { results?: ItunesTrack[] }).results ?? [])
    .filter((r) => r.previewUrl && r.artistName && squash(r.artistName).includes(va) && !isGroup(r.artistName))
    .slice(0, 80).map((r) => ({ artistName: r.artistName, trackName: r.trackName, previewUrl: r.previewUrl }));
}, ["voice-tracks-v1", voiceNative, term], { revalidate: 30 * 86_400 })();

/**
 * Seconde source : l'API publique de Deezer (sans clé, aperçus de 30 s). Elle a d'autres
 * chansons de personnage et des pistes de drama CD. Réponse : { data: [{ title, preview, artist: { name } }] }.
 */
export interface DeezerTrack { title?: string; preview?: string; type?: string; artist?: { name?: string } }
export const fromDeezer = (data: DeezerTrack[]): ItunesTrack[] =>
  data.filter((t) => (!t.type || t.type === "track") && t.preview && t.artist?.name).map((t) => ({ artistName: t.artist!.name, trackName: t.title, previewUrl: t.preview }));

const deezerOf = (voiceNative: string, term: string) => unstable_cache(async (): Promise<ItunesTrack[]> => {
  const res = await fetch(`https://api.deezer.com/search?${new URLSearchParams({ q: term, limit: "100" })}`, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  const body = (await res.json()) as { data?: DeezerTrack[]; error?: unknown };
  if (body.error || !Array.isArray(body.data)) throw new Error("Deezer indisponible");
  const va = squash(voiceNative);
  return fromDeezer(body.data).filter((r) => squash(r.artistName!).includes(va) && !isGroup(r.artistName!)).slice(0, 80);
}, ["voice-deezer-v1", voiceNative, term], { revalidate: 30 * 86_400 })();

/** Extrait de voix d'un personnage, ou null s'il n'y en a pas (ou si les deux sources se taisent). */
export async function voiceClip(voiceNative: string, charNative: string | null): Promise<VoiceClip | null> {
  let best: VoiceClip | null = null;
  try { best = pickVoiceClip(await tracksOf(voiceNative), voiceNative, charNative); } catch { /* iTunes indisponible */ }
  if (best?.inRole || !charNative) return best;
  // Pas de chanson dans le rôle parmi ses titres les plus connus : on cherche le personnage
  // lui-même, sur iTunes puis sur Deezer ; à défaut, Deezer peut au moins donner sa voix.
  const tries: (() => Promise<ItunesTrack[]>)[] = [
    () => tracksOf(voiceNative, `${charNative} ${voiceNative}`),
    () => deezerOf(voiceNative, `${charNative} ${voiceNative}`),
    ...(best ? [] : [() => deezerOf(voiceNative, voiceNative)]),
  ];
  for (const get of tries) {
    try {
      const clip = pickVoiceClip(await get(), voiceNative, charNative);
      if (clip?.inRole) return clip;
      best ??= clip;
    } catch { /* source indisponible : on passe à la suivante */ }
  }
  return best;
}
