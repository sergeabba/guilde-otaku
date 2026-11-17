// Réponse tapée au clavier : comparaison tolérante (accents, casse, ponctuation, petites fautes).
export const normAnswer = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
/** Sans article en tête (« L'Attaque des Titans » = « Attaque des Titans »). */
const core = (s: string) => normAnswer(s).replace(/^(l|le|la|les|the|a|an) /, "");

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}

/** Vrai si la saisie correspond à l'un des titres (une faute tolérée tous les 7 caractères). */
export function sameTitle(input: string, titles: (string | null | undefined)[]): boolean {
  const a = core(input);
  if (a.length < 2) return false;
  return titles.some((t) => {
    if (!t) return false;
    const b = core(t);
    return a === b || lev(a, b) <= Math.max(1, Math.floor(b.length / 7));
  });
}
