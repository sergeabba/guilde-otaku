// Extraits de voix des seiyuu pour le jeu « La voix » : aperçus de 30 secondes de l'API
// iTunes Search (les mêmes que le blind test), choisis parmi les chansons interprétées
// par le doubleur, de préférence dans le rôle du personnage (« Eren Yeager (CV: Kaji Yuuki) »).
// Seule l'adresse de l'aperçu part vers le navigateur : ni titre ni artiste, rien qui trahisse la réponse.
import { unstable_cache } from "next/cache";

export interface ItunesTrack { artistName?: string; trackName?: string; previewUrl?: string; kind?: string }
export interface VoiceClip { url: string; inRole: boolean }

/** Sans espaces ni ponctuation japonaise : « 梶 裕貴 » et « 梶裕貴 » se valent. */
const squash = (s: string) => s.normalize("NFKC").replace(/[\s・·.=＝()（）\[\]【】:：]/g, "").toLowerCase();
/** Plusieurs interprètes (duo, groupe) : on écarte, la voix ne serait pas isolée. */
const isGroup = (artist: string) => /[、,&×＆/]|feat|with|\bx\b/i.test(artist) || (artist.match(/CV/gi)?.length ?? 0) > 1;
const NOT_VOICE = /instrumental|off ?vocal|karaoke|カラオケ|オリジナル・カラオケ|inst\.|bgm/i;

/**
 * Meilleur extrait parmi des résultats iTunes : 1) chanson dans le rôle du personnage,
 * 2) chanson du doubleur sous son nom, 3) chanson dans un autre rôle. Null si aucune.
 */
export function pickVoiceClip(results: ItunesTrack[], voiceNative: string, charNative?: string | null): VoiceClip | null {
  const va = squash(voiceNative);
  if (va.length < 2) return null;
  const ch = charNative ? squash(charNative) : "";
  // Le personnage est souvent crédité par son seul prénom ou nom : un des deux suffit.
  const chParts = charNative ? charNative.split(/[\s・·]+/).map(squash).filter((x) => x.length >= 2) : [];
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

/** Extrait de voix d'un personnage, ou null s'il n'y en a pas (ou si iTunes ne répond pas). */
export async function voiceClip(voiceNative: string, charNative: string | null): Promise<VoiceClip | null> {
  let best: VoiceClip | null = null;
  try { best = pickVoiceClip(await tracksOf(voiceNative), voiceNative, charNative); } catch { /* iTunes indisponible */ }
  if (best?.inRole || !charNative) return best;
  // Pas de chanson dans le rôle parmi ses titres les plus connus : on cherche le personnage lui-même.
  try { return pickVoiceClip(await tracksOf(voiceNative, `${charNative} ${voiceNative}`), voiceNative, charNative) ?? best; } catch { return best; }
}
