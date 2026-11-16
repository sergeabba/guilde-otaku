// Séries gratuites et légales sur YouTube : épisodes complets publiés par les chaînes
// OFFICIELLES (ayants droit), en français. Sélection vérifiée le 16 novembre 2026 :
// - chaîne officielle (badge YouTube « vérifiée » ou chaîne de l'éditeur qui se présente
//   comme telle, avec son audience) ;
// - lecture intégrée autorisée (oEmbed YouTube) pour la première vidéo et la playlist.
// La disponibilité par pays dépend de l'ayant droit et peut évoluer : en cas de blocage,
// le lecteur YouTube l'indique et le bouton « Chaîne officielle » reste disponible.
// Liste statique : le site n'interroge pas YouTube à chaque visite.

export interface FreeSeason { label: string; list: string; first: string }
export interface FreeShow {
  key: string;
  title: string;
  kind: "Anime" | "Dessin animé";
  pitch: string;
  channel: string;
  channelId: string;
  verified: boolean;
  color: string;
  seasons: FreeSeason[];
}

export const FREE_SHOWS: FreeShow[] = [
  { key: "inazuma", title: "Inazuma Eleven", kind: "Anime", pitch: "Mark Evans et le club de foot du collège Raimon : supertirs, tournois et esprit d'équipe.", channel: "Inazuma Eleven France officiel", channelId: "UCGMvTdioudzJSa5uTAY6FDw", verified: false, color: "#f5a524",
    seasons: [
      { label: "Saison 1", list: "PLS5-Mn4eX2p99V2WbUBJzTCTjXkj7tdrU", first: "ZoFKfxJ0zC8" },
      { label: "Saison 2", list: "PLS5-Mn4eX2p_CPqfXL1U_p-E6K5P3wEgr", first: "z1D2-N51EzY" },
      { label: "Saison 3", list: "PLS5-Mn4eX2p-_ey3mcjoSlT-2y8B97sxM", first: "Z5rD-JGK4_8" },
    ] },
  { key: "olive", title: "Olive et Tom", kind: "Anime", pitch: "Captain Tsubasa en VF : Olivier Atton, Thomas Price et les matchs qui durent trois épisodes.", channel: "Olive et Tom | Officiel", channelId: "UCWQ2PIaUUzmXG8VWwdKCHwA", verified: true, color: "#3b82f6",
    seasons: [
      { label: "Saison 1 · 1re partie", list: "PLMwDGj-9r3hyN_VCCSlLG5ZqgFs3F4p4L", first: "cGnMCv-85Ew" },
      { label: "Saison 1 · 2e partie", list: "PLMwDGj-9r3hxUtNXHID-VZsoeyRaxZKFA", first: "_GgAnEJZ91g" },
      { label: "Les films", list: "PLMwDGj-9r3hxHYIWZnTI5HbnkftauthPS", first: "zo_IKpYVk9M" },
    ] },
  { key: "galactik", title: "Galactik Football", kind: "Dessin animé", pitch: "Les Snow Kids, le Souffle et la Coupe Galactik : le foot le plus populaire de la galaxie.", channel: "Galactik Football en Français", channelId: "UCgYPYE89nSkWQrjH0ehtdbQ", verified: true, color: "#22c55e",
    seasons: [
      { label: "Saison 1", list: "PLK36dWVPxwqvIpSDWp0C01AX3GtJbaUEp", first: "wDV4ZaCFZ6U" },
      { label: "Saison 2", list: "PLK36dWVPxwqu73cGiy4BC1O5fhtWx6_ae", first: "rZD9EAQmsYA" },
    ] },
  { key: "beyblade", title: "Beyblade", kind: "Anime", pitch: "Toupies, lanceurs et duels survoltés, de Metal Fusion à Burst.", channel: "BEYBLADE Français - Chaîne Officielle", channelId: "UCP-PhaZQo-LRd2IPYscwHfw", verified: false, color: "#e8412c",
    seasons: [
      { label: "Metal Fusion", list: "PLxVEjLrKvugFKE6LK6SbvGu1Pi9Tlt-bY", first: "pF3GZF-37Ik" },
      { label: "Metal Masters", list: "PLxVEjLrKvugH-xmr8S-aT6OYNFTm-Gf6y", first: "GXTno_iHF5I" },
      { label: "Burst", list: "PLxVEjLrKvugEAh2bNyekMRKbogbvG6S0o", first: "KJ2k6TPffbI" },
    ] },
  { key: "wakfu", title: "Wakfu", kind: "Dessin animé", pitch: "Yugo et la Confrérie du Tofu : l'animation française d'Ankama, en intégralité.", channel: "Ankama Animations", channelId: "UCBHzdt-7DdLgyyQbyJigWsw", verified: true, color: "#14b8a6",
    seasons: [
      { label: "Saison 1", list: "PLHL1Oo127tT3BZenFGvVJWr7EwFacyM3l", first: "utklVKDpuGU" },
      { label: "Saison 2", list: "PLHL1Oo127tT2flLGpownjcnBuhr9AGV1T", first: "mTUufmg64ao" },
      { label: "Saison 3", list: "PLHL1Oo127tT1-ib4LMYzBe5Ysj5wrhlwY", first: "j3fs6IAiaAM" },
    ] },
  { key: "lyoko", title: "Code Lyoko", kind: "Dessin animé", pitch: "Kadic, l'usine et le supercalculateur : quatre ados contre XANA.", channel: "CODE LYOKO OFFICIEL", channelId: "UCQiZ4G8PHqUIji3c74jBiTA", verified: true, color: "#a855f7",
    seasons: [{ label: "Tous les épisodes", list: "PLG5nW1nH7k18DwYx69mkDOYJ-G1CU7dnk", first: "QCGixQKvTpA" }] },
  { key: "pokemon", title: "Pokémon, les horizons", kind: "Anime", pitch: "Liko, Roy et le nouveau chapitre de la série Pokémon, sur la chaîne officielle.", channel: "La chaîne officielle Pokémon en français", channelId: "UCwEC7GXV2G0S7KYXSK1WjXw", verified: true, color: "#facc15",
    seasons: [{ label: "La série", list: "PLVXmcWvDTic--hg11Goi52gWlC5PeVTOC", first: "dHnR2XyKYas" }] },
  { key: "spies", title: "Totally Spies!", kind: "Dessin animé", pitch: "Sam, Clover et Alex, espionnes du WOOHP entre deux cours.", channel: "Totally Spies! Français", channelId: "UC9k6s1zbvtnIvF8eJcuVpzw", verified: true, color: "#f472b6",
    seasons: [
      { label: "Saison 2", list: "PLApsgU8UHjWWZduDA0A-n2ZTnZKkOFUFu", first: "1VKPvR3tdZc" },
      { label: "Saison 3", list: "PLApsgU8UHjWXV1Rw0oiDa10R7pzQLzQSk", first: "F3ZcZq0OUKE" },
    ] },
  { key: "cites", title: "Les Mystérieuses Cités d'Or", kind: "Dessin animé", pitch: "Esteban, Zia et Tao en route vers les cités d'or : le classique franco-japonais.", channel: "Les mystérieuses cités d'or - Officielle", channelId: "UC0Wy5l5KuDCd7j4s27POrKw", verified: false, color: "#c9a84c",
    seasons: [{ label: "Compilation 9 h", list: "PLRFUgwfPCwtkVPF0yyyaaS8D8Pvme0UB-", first: "vpF8cw9CnXw" }] },
];

export const ytThumb = (id: string, q: "hq" | "maxres" | "mq" = "hq") => `https://i.ytimg.com/vi/${id}/${q}default.jpg`;
export const ytPlaylistEmbed = (list: string) => `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&rel=0&playsinline=1`;
export const ytChannelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;
