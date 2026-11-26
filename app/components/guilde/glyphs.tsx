// Glyphes originaux de la Guilde (dessinés pour elle, aucun emprunt) : un par grade et un
// par rubrique. Grille de 100 × 100, centre (50, 50), le glyphe tient dans un rayon de 26.
// Remplis avec currentColor : la couleur vient du sceau qui les porte.
import type { ReactNode } from "react";

/** Étoile à n branches (polygone), utile pour plusieurs glyphes. */
export function starPoints(n: number, R: number, r: number, cx = 50, cy = 50, rot = -90): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180, rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const flame = "M50 28 C58 40 66 47 62 60 C59 70 41 70 38 60 C35 49 46 44 50 28 Z";
const crown = "M28 64 L30 38 L40 50 L50 32 L60 50 L70 38 L72 64 Z";

/** Grades : emblèmes de rang (cérémonie, fiches, filtres). */
export const RANK_GLYPHS: Record<string, ReactNode> = {
  // Le point d'origine : rose des vents à huit branches.
  "Fondateur": <><polygon points={starPoints(8, 27, 9)} /><circle cx="50" cy="50" r="5" fill="var(--sc-bg)" /></>,
  // La couronne.
  "Monarque": <><path d={crown} /><rect x="28" y="66" width="44" height="6" /></>,
  // La couronne d'avant, posée de biais et fendue.
  "Ex Monarque": <g transform="rotate(-16 50 54)"><path d={crown} /><rect x="28" y="66" width="44" height="6" /><path d="M46 30 L56 48 L49 52 L58 72" fill="none" stroke="var(--sc-bg)" strokeWidth="3.5" /></g>,
  // Le croissant et l'étoile.
  "Ordre Céleste": <><path d="M58 26 A25 25 0 1 0 58 74 A19 19 0 1 1 58 26 Z" /><polygon points={starPoints(5, 9, 3.6, 66, 46)} /></>,
  // Le soleil qui se lève : la nouvelle génération.
  "New G dorée": <><path d="M24 64 A26 26 0 0 1 76 64 Z" />{[-60, -30, 0, 30, 60].map((a) => <rect key={a} x="48.5" y="24" width="3" height="10" transform={`rotate(${a} 50 64)`} />)}<rect x="20" y="66" width="60" height="4" /></>,
  // La pousse.
  "Futurs Espoirs": <><rect x="48.5" y="44" width="3" height="32" /><path d="M50 58 C37 58 30 50 30 40 C41 40 50 46 50 58 Z" /><path d="M50 50 C50 37 58 28 70 28 C70 40 62 50 50 50 Z" /></>,
  // Les deux lames croisées.
  "Vieux Briscard": <>{[45, -45].map((a) => <g key={a} transform={`rotate(${a} 50 50)`}><path d="M47.5 20 L50 15 L52.5 20 L52.5 62 L47.5 62 Z" /><rect x="40" y="62" width="20" height="4" /><circle cx="50" cy="71" r="3.5" /></g>)}</>,
  // L'œil voilé.
  "Fantôme": <><path d="M24 54 Q50 30 76 54 Q50 76 24 54 Z" fill="none" stroke="currentColor" strokeWidth="4" /><circle cx="50" cy="54" r="8" /><path d="M26 40 Q50 18 74 40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" /></>,
  // Le cercle qui revient sur lui-même, et la flamme.
  "Revenant": <><path d="M72 42 A24 24 0 1 1 60 28" fill="none" stroke="currentColor" strokeWidth="4" /><polygon points="56,20 70,26 58,36" /><path d="M50 36 C55 44 59 48 57 56 C55 62 45 62 43 56 C41 49 48 46 50 36 Z" /></>,
  "Tous": <polygon points={starPoints(6, 26, 12)} />,
};

/** Rubriques : emblèmes de navigation. */
export const RUBRIC_GLYPHS: Record<string, ReactNode> = {
  accueil: <><path d={flame} /><polygon points={starPoints(4, 7, 2.5, 50, 56)} fill="var(--sc-bg)" /></>,
  membres: <>{[[34, 42], [66, 42], [50, 36]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={i === 2 ? 8 : 6.5} /><path d={`M${x - (i === 2 ? 13 : 10)} ${y + 26} A${i === 2 ? 13 : 10} ${i === 2 ? 13 : 10} 0 0 1 ${x + (i === 2 ? 13 : 10)} ${y + 26} Z`} /></g>)}</>,
  teams: <><path d="M30 26 H70 V50 C70 64 60 72 50 77 C40 72 30 64 30 50 Z" /><path d="M30 44 L70 30 V38 L30 52 Z" fill="var(--sc-bg)" /></>,
  wanted: <><circle cx="50" cy="50" r="19" fill="none" stroke="currentColor" strokeWidth="4" /><circle cx="50" cy="50" r="4" />{[0, 90, 180, 270].map((a) => <rect key={a} x="48" y="22" width="4" height="14" transform={`rotate(${a} 50 50)`} />)}</>,
  birthdays: <><rect x="43" y="46" width="14" height="30" /><path d="M50 22 C55 30 58 34 56 39 C55 43 45 43 44 39 C42 34 47 31 50 22 Z" /><rect x="34" y="74" width="32" height="4" /></>,
  bibliotheque: <><path d="M50 34 C42 28 32 28 24 30 V70 C32 68 42 68 50 74 Z" /><path d="M50 34 C58 28 68 28 76 30 V70 C68 68 58 68 50 74 Z" opacity=".72" /></>,
  cinema: <><circle cx="50" cy="50" r="25" /><circle cx="50" cy="50" r="4" fill="var(--sc-bg)" />{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="50" cy="36" r="6" fill="var(--sc-bg)" transform={`rotate(${a} 50 50)`} />)}</>,
  calendrier: <><circle cx="26" cy="50" r="9" /><path d="M50 41 A9 9 0 0 1 50 59 Z" /><circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M78 41 A9 9 0 1 0 78 59 A6 6 0 1 1 78 41 Z" /></>,
  jeux: <g transform="rotate(12 50 50)"><rect x="28" y="28" width="44" height="44" rx="6" />{[[39, 39], [61, 61], [50, 50], [61, 39], [39, 61]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.2" fill="var(--sc-bg)" />)}</g>,
  atelier: <><path d="M66 24 L74 32 L48 58 L42 52 Z" /><path d="M42 52 L48 58 C46 68 36 74 26 74 C30 70 30 62 34 58 C36 55 39 53 42 52 Z" /></>,
  "bons-plans": <><circle cx="38" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="5" /><rect x="48" y="47.5" width="28" height="5" /><rect x="64" y="52" width="5" height="9" /><rect x="72" y="52" width="4" height="7" /></>,
  fighters: <polygon points="56,20 34,54 48,54 42,80 68,42 53,42 60,20" />,
  "film-semaine": <><path d="M24 36 H76 V44 A6 6 0 0 0 76 56 V64 H24 V56 A6 6 0 0 0 24 44 Z" /><rect x="58" y="38" width="2.5" height="24" fill="var(--sc-bg)" /></>,
};
