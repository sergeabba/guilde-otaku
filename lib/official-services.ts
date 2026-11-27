// Plateformes officielles (diffusion sous licence) reconnues par leur domaine. Sert à
// distinguer, dans les Bons Plans, les services officiels des autres ressources partagées
// par les membres. Liste fermée et vérifiable : un domaine absent n'est pas déclaré officiel.
const OFFICIAL: Record<string, string> = {
  "crunchyroll.com": "Crunchyroll",
  "animationdigitalnetwork.com": "ADN",
  "animationdigitalnetwork.fr": "ADN",
  "netflix.com": "Netflix",
  "primevideo.com": "Prime Video",
  "disneyplus.com": "Disney+",
  "mangaplus.shueisha.co.jp": "Manga Plus",
  "webtoons.com": "Webtoon",
  "mangacollec.com": "Mangacollec",
  "youtube.com": "YouTube",
};

export function hostOf(url: string): string {
  try { return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}
/** Nom de la plateforme officielle, ou null. */
export function officialService(url: string): string | null {
  const h = hostOf(url);
  const hit = Object.keys(OFFICIAL).find((d) => h === d || h.endsWith(`.${d}`));
  return hit ? OFFICIAL[hit] : null;
}
