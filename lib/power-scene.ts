// Moteur des scènes de pouvoir : à partir du texte réel d'un bankai ou d'un territoire (nom,
// traduction, effet), on déduit une ou deux familles visuelles. Rien n'est ajouté au pouvoir :
// la scène illustre seulement ce que la fiche dit déjà.

export type Family =
  | "vegetation" | "temps" | "nuit" | "lumiere" | "feu" | "glace" | "foudre" | "ombre"
  | "miroir" | "voix" | "savoir" | "spectacle" | "sport" | "couleur" | "pierre" | "fete"
  | "royaute" | "fantome" | "vitesse" | "vent" | "vide" | "force";

const RULES: [Family, RegExp][] = [
  ["vegetation", /foret|arbre|feuill|jardin|fleur|petale|cerisier|tournesol|champ|racine|hamac/],
  ["temps", /temps|ralenti|lent|paress|eternel|instant|heure|jeudi|quinze ans|chill|tranquille|calme|paisible|detend/],
  ["nuit", /nuit|lune|etoile|firmament|ciel|soir|eclipse/],
  ["lumiere", /lumiere|soleil|eclat|rayon|brille|illumin|eblou|or\b|dore|golden|pied d.or/],
  ["feu", /feu|flamme|incendie|etincelle|brul|braise|demon/],
  ["glace", /glace|gel|givre|froid|neige/],
  ["foudre", /foudre|eclair|electri|orage|tonnerre|pikachu/],
  ["ombre", /noir|ombre|tenebr|obscur|coupe le courant|courant|plus de lumiere/],
  ["miroir", /miroir|copie|visage|metamorph|doublure|change de|pseudo|disparait|apparait|absence/],
  ["voix", /voix|vocale|murmure|discours|parler|chanteu|concert|refrain|mot|citation|silence|eloquence|orateur|rime|vers\b/],
  ["savoir", /question|quiz|encyclop|statisti|bibliotheque|sagesse|science|calcul|probabil|reference|chronique|powerpoint|diapositive|observ|enigme|secret/],
  ["spectacle", /cinema|theatre|film|projection|scene|tournage|seance|ecran|projecteur/],
  ["sport", /stade|ballon|passe|frappe enroulee|course|sprint|arene|supporter|terrain|grappling|prise au sol|charge|cornes|sport/],
  ["couleur", /peinture|couleur|pinceau|toile|peint/],
  ["pierre", /pierre|emeraude|precieuse|mine\b|petrif|roche|grotte/],
  ["fete", /fete|bonbon|confiserie|sucre|banquet|cuisine|plat|bar\b|tournee|coupe|trinque|hospitalit|sourire|rire|joie|matsuri/],
  ["royaute", /couronne|royaume|reine|roi\b|prince|ange|aile|sanctuaire|deesse|bouclier|chevalier|temple|mere du peuple/],
  ["fantome", /fantome|horreur|peur|kaidan|ame\b|resurrection|revient|histoire de fantomes|sang|faim/],
  ["vitesse", /rapide|vitesse|eclair de champion|repart|trois fois|frappe sans bruit/],
  ["vent", /brise|vent|souffle/],
  ["vide", /vide|espace|labyrinthe|engloutit|dimension/],
];

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Familles du pouvoir, de la plus marquée à la moins (au plus deux). Repli : « force ». */
export function familiesOf(text: string): Family[] {
  const t = fold(text);
  const hits = RULES.map(([f, re]) => [f, (t.match(new RegExp(re.source, "g")) ?? []).length] as const).filter(([, n]) => n > 0);
  hits.sort((a, b) => b[1] - a[1]);
  const out = hits.slice(0, 2).map(([f]) => f);
  return out.length ? out : ["force"];
}

/** Palette par famille : fond profond, teinte vive, encre, lueur. */
export const PALETTE: Record<Family, { bg: string; hue: string; ink: string; glow: string }> = {
  vegetation: { bg: "#0f2418", hue: "#4f9a4a", ink: "#08140c", glow: "#c9e39a" },
  temps: { bg: "#1c1a2b", hue: "#b9a5e8", ink: "#0c0b14", glow: "#efe6ff" },
  nuit: { bg: "#0a0e24", hue: "#4b5bb8", ink: "#05060f", glow: "#f3e9b8" },
  lumiere: { bg: "#3a2606", hue: "#f2b632", ink: "#1a1003", glow: "#fff4cf" },
  feu: { bg: "#2a0805", hue: "#ef4a1d", ink: "#120302", glow: "#ffd27a" },
  glace: { bg: "#0b2233", hue: "#7fd3f2", ink: "#04111a", glow: "#eafaff" },
  foudre: { bg: "#120f2c", hue: "#ffe14a", ink: "#07061a", glow: "#fffbe0" },
  ombre: { bg: "#050507", hue: "#3a3348", ink: "#000", glow: "#d9d3e8" },
  miroir: { bg: "#1a1d26", hue: "#a8b6cc", ink: "#0a0c12", glow: "#ffffff" },
  voix: { bg: "#24102a", hue: "#e06bb8", ink: "#100612", glow: "#ffd9f0" },
  savoir: { bg: "#13202a", hue: "#3fb6a8", ink: "#071014", glow: "#e3fff9" },
  spectacle: { bg: "#1d0a0e", hue: "#c8102e", ink: "#0d0406", glow: "#ffe2a8" },
  sport: { bg: "#0d2414", hue: "#2fbf5a", ink: "#061009", glow: "#f2fff0" },
  couleur: { bg: "#1a1230", hue: "#ff5fa2", ink: "#0b0716", glow: "#fff3a8" },
  pierre: { bg: "#10221d", hue: "#2fae7e", ink: "#06100c", glow: "#d8fff0" },
  fete: { bg: "#2a1020", hue: "#ff8a3d", ink: "#120610", glow: "#fff0c2" },
  royaute: { bg: "#1d1430", hue: "#e9c46a", ink: "#0b0716", glow: "#fff6d8" },
  fantome: { bg: "#0d1414", hue: "#6fbfb0", ink: "#030707", glow: "#d8fff6" },
  vitesse: { bg: "#0c1630", hue: "#3d8bff", ink: "#040814", glow: "#e6f0ff" },
  vent: { bg: "#13242a", hue: "#9ad4d6", ink: "#071114", glow: "#f2ffff" },
  vide: { bg: "#06060c", hue: "#6a5acd", ink: "#000", glow: "#cfc8ff" },
  force: { bg: "#1c0c0c", hue: "#d7332b", ink: "#0a0404", glow: "#ffe0c8" },
};

/** Générateur reproductible (même membre, même scène). */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 10000) / 10000; };
}
