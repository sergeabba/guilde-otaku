// Synopsis français d'un manga quand MangaDex n'en a pas :
//  1. Wikipédia en français, section « Synopsis » (ou « Résumé », « Histoire »),
//     texte sous licence CC BY-SA : crédité avec un lien vers l'article ;
//  2. sinon, le synopsis français de l'adaptation animée sur TMDB, présenté comme tel.
// Jamais de texte anglais. Module serveur.
import { unstable_cache } from "next/cache";
import { tmdbGet } from "./tmdb";

export interface FrSynopsis { text: string; credit: { label: string; url: string } }

const UA = "GuildeOtaku/1.0 (https://guilde-otaku.vercel.app/)";
const MAX = 600;

/** Coupe proprement à la fin d'une phrase, sous `max` caractères. */
export function trimSynopsis(s: string, max = MAX): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" ! "), cut.lastIndexOf(" ? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Extrait la section « Synopsis » d'un texte brut d'article (format wiki « == Titre == »). */
export function synopsisSection(extract: string): string | null {
  const m = extract.match(/\n==+ *(Synopsis|Résumé|Histoire|Intrigue|Scénario)[^=\n]*==+\n([\s\S]*?)(?=\n==[^=]|$)/);
  if (!m) return null;
  const body = m[2].replace(/\n==+[^=\n]+==+\n/g, "\n").trim();
  return body.length >= 80 ? body : null;
}

async function fromWikipedia(title: string): Promise<FrSynopsis | null> {
  const params = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: `${title} manga`, gsrlimit: "1",
    prop: "extracts", explaintext: "1", exsectionformat: "wiki", format: "json", formatversion: "2",
  });
  const res = await fetch(`https://fr.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Wikipédia ${res.status}`);
  const page = (await res.json())?.query?.pages?.[0];
  const extract: string = page?.extract ?? "";
  // L'article doit parler d'un manga (pas d'un homonyme).
  if (!page?.title || !/manga|manhwa|bande dessinée japonaise/i.test(extract.slice(0, 1200))) return null;
  const section = synopsisSection(extract);
  if (!section) return null;
  return {
    text: trimSynopsis(section),
    credit: { label: "Wikipédia (CC BY-SA)", url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}` },
  };
}

/** Comparaison de titres sans accents, casse ni ponctuation. */
export const sameTitle = (a?: string, b?: string) => {
  const n = (s?: string) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  return !!n(a) && n(a) === n(b);
};

async function fromAnimeAdaptation(titles: string[]): Promise<FrSynopsis | null> {
  const r = await tmdbGet<{ results?: { id: number; name?: string; original_name?: string; overview?: string; genre_ids?: number[]; origin_country?: string[] }[] }>(`/search/tv?query=${encodeURIComponent(titles[0])}&include_adult=false`);
  // Adaptation retenue seulement si son titre est exactement celui du manga : une
  // série homonyme ou voisine donnerait un synopsis faux.
  const hit = (r.results ?? []).find((x) => x.genre_ids?.includes(16) && x.origin_country?.includes("JP") && x.overview?.trim()
    && titles.some((t) => sameTitle(t, x.name) || sameTitle(t, x.original_name)));
  if (!hit?.overview) return null;
  return { text: trimSynopsis(hit.overview), credit: { label: "TMDB, synopsis de l'adaptation animée", url: `https://www.themoviedb.org/tv/${hit.id}` } };
}

/** Premier synopsis français trouvé pour l'un des titres donnés (mis en cache 7 jours). */
export const frenchMangaSynopsis = unstable_cache(async (titles: string[]): Promise<FrSynopsis | null> => {
  const list = [...new Set(titles.map((t) => t.trim()).filter(Boolean))].slice(0, 3);
  let wikipediaFailed = false;
  for (const t of list) {
    const wp = await fromWikipedia(t).catch(() => { wikipediaFailed = true; return null; });
    if (wp) return wp;
  }
  for (const t of list) {
    const tv = await fromAnimeAdaptation([t, ...list.filter((x) => x !== t)]).catch(() => null);
    if (tv) return tv;
  }
  // Wikipédia indisponible (limite, réseau) : pas de « rien trouvé » mis en cache, on réessaiera.
  if (wikipediaFailed) throw new Error("Wikipédia indisponible");
  return null;
}, ["fr-manga-synopsis-v2"], { revalidate: 60 * 60 * 24 * 7 });
