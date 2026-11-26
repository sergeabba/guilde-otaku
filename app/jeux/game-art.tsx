// Identité de chaque borne : un emblème original dessiné en SVG (pas une icône générique),
// un motif d'écran et une police d'enseigne. Sert aux bornes de la salle et à l'écran-titre
// qui s'affiche au lancement d'un jeu. Couleurs : `currentColor` (néon de la borne) et
// `var(--c2)` (couleur d'appoint).
import type { ReactNode } from "react";

export type Pattern = "rays" | "dots" | "stripes" | "grid" | "waves" | "scan" | "checker";
export interface GameArt { emblem: ReactNode; pattern: Pattern; font: "anton" | "dela" | "cinzel" | "orbitron" | "bebas" | "black-ops"; c2: string }

const S = { fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const GAME_ART: Record<string, GameArt> = {
  "defi-jour": { pattern: "rays", font: "anton", c2: "#fff4d6", emblem: <><rect x="12" y="14" width="40" height="38" rx="3" {...S} /><path d="M12 24 H52" {...S} /><path d="M22 9 V18 M42 9 V18" {...S} /><path d="M32 29 l3.4 7 7.6 1 -5.5 5.2 1.4 7.6 -6.9 -3.7 -6.9 3.7 1.4 -7.6 -5.5 -5.2 7.6 -1z" fill="var(--c2)" stroke="currentColor" strokeWidth="2" /></> },
  "devine-anime": { pattern: "scan", font: "dela", c2: "#ffe0f0", emblem: <><rect x="8" y="14" width="34" height="26" rx="2" {...S} /><path d="M8 20 H42 M8 34 H42" {...S} strokeWidth={2} /><circle cx="40" cy="38" r="11" {...S} fill="var(--c2)" fillOpacity=".25" /><path d="M48 46 L57 55" {...S} strokeWidth={6} /></> },
  "devine-perso": { pattern: "dots", font: "anton", c2: "#ffe6cc", emblem: <><circle cx="28" cy="22" r="10" fill="currentColor" /><path d="M10 54 C10 40 18 34 28 34 C38 34 46 40 46 54 Z" fill="currentColor" /><path d="M46 14 C46 8 56 8 56 14 C56 19 51 19 51 24" {...S} stroke="var(--c2)" /><circle cx="51" cy="31" r="2.6" fill="var(--c2)" /></> },
  emoji: { pattern: "checker", font: "bebas", c2: "#fff7c2", emblem: <><path d="M10 12 H54 V42 H30 L18 52 V42 H10 Z" {...S} /><circle cx="25" cy="25" r="3" fill="currentColor" /><circle cx="39" cy="25" r="3" fill="currentColor" /><path d="M23 32 Q32 40 41 32" {...S} stroke="var(--c2)" /></> },
  themes: { pattern: "stripes", font: "orbitron", c2: "#dff5ff", emblem: <><path d="M10 18 L30 18 L44 32 L30 46 L10 46 Z" {...S} /><circle cx="19" cy="32" r="3.5" fill="currentColor" /><path d="M36 14 L50 14 L58 22" {...S} stroke="var(--c2)" /><path d="M42 50 L52 40" {...S} stroke="var(--c2)" /></> },
  createur: { pattern: "waves", font: "cinzel", c2: "#f1e3ff", emblem: <><path d="M32 6 L46 28 L32 58 L18 28 Z" {...S} /><path d="M32 30 V58" {...S} strokeWidth={2} /><circle cx="32" cy="28" r="3.5" fill="var(--c2)" /><path d="M8 58 Q20 50 32 58 T56 58" {...S} strokeWidth={2.5} stroke="var(--c2)" /></> },
  studio: { pattern: "grid", font: "black-ops", c2: "#ffe1e6", emblem: <><path d="M8 26 H56 V54 H8 Z" {...S} /><path d="M8 26 L14 12 L56 12 L50 26" {...S} /><path d="M20 12 L14 26 M32 12 L26 26 M44 12 L38 26" {...S} strokeWidth={3} stroke="var(--c2)" /><path d="M26 34 L40 40 L26 46 Z" fill="currentColor" /></> },
  voix: { pattern: "waves", font: "anton", c2: "#d9fff0", emblem: <><rect x="24" y="8" width="16" height="28" rx="8" fill="currentColor" /><path d="M16 30 Q16 44 32 44 Q48 44 48 30 M32 44 V54 M22 56 H42" {...S} /><path d="M8 22 Q4 30 8 38 M56 22 Q60 30 56 38" {...S} strokeWidth={3} stroke="var(--c2)" /></> },
  direct: { pattern: "dots", font: "orbitron", c2: "#d8fffb", emblem: <><path d="M6 14 H34 V32 H18 L10 40 V32 H6 Z" {...S} /><path d="M58 24 H30 V42 H46 L54 50 V42 H58 Z" {...S} stroke="var(--c2)" /><circle cx="52" cy="12" r="5" fill="#ff3b3b" /></> },
  quiz: { pattern: "rays", font: "dela", c2: "#ffe0da", emblem: <><path d="M12 38 V30 C12 18 21 10 32 10 C43 10 52 18 52 30 V38" {...S} /><rect x="8" y="36" width="10" height="16" rx="3" fill="currentColor" /><rect x="46" y="36" width="10" height="16" rx="3" fill="currentColor" /><path d="M30 26 V40 M30 26 L38 23 V37" {...S} strokeWidth={3} stroke="var(--c2)" /><circle cx="27" cy="41" r="3" fill="var(--c2)" /><circle cx="35" cy="38" r="3" fill="var(--c2)" /></> },
  nostalgie: { pattern: "stripes", font: "bebas", c2: "#fff0f6", emblem: <><rect x="8" y="16" width="48" height="34" rx="6" {...S} /><path d="M24 6 L32 16 L40 6" {...S} strokeWidth={3} /><path d="M14 40 Q24 24 32 40 Q40 24 50 40" fill="none" stroke="var(--c2)" strokeWidth="3" /><path d="M16 46 H48" {...S} strokeWidth={2} /><circle cx="50" cy="54" r="2" fill="currentColor" /></> },
  generiques: { pattern: "scan", font: "anton", c2: "#ffe0e5", emblem: <><rect x="10" y="10" width="44" height="44" rx="2" {...S} /><path d="M18 10 V54 M46 10 V54" {...S} strokeWidth={2} /><path d="M10 20 H18 M10 30 H18 M10 40 H18 M46 20 H54 M46 30 H54 M46 40 H54" {...S} strokeWidth={2} /><rect x="23" y="22" width="18" height="20" fill="var(--c2)" opacity=".35" /><path d="M28 27 L37 32 L28 37 Z" fill="currentColor" /></> },
  affiche: { pattern: "grid", font: "dela", c2: "#dcf2ff", emblem: <><rect x="12" y="6" width="40" height="52" rx="2" {...S} /><path d="M12 23 H52 M12 40 H52 M25.3 6 V58 M38.6 6 V58" {...S} strokeWidth={2} /><rect x="27" y="25" width="10" height="13" fill="var(--c2)" /><rect x="40" y="8" width="10" height="13" fill="currentColor" opacity=".6" /></> },
  "plus-moins": { pattern: "checker", font: "black-ops", c2: "#dcffe8", emblem: <><path d="M20 30 L20 8 M10 18 L20 8 L30 18" {...S} strokeWidth={5} /><path d="M44 34 L44 56 M34 46 L44 56 L54 46" {...S} strokeWidth={5} stroke="var(--c2)" /></> },
  tier: { pattern: "stripes", font: "anton", c2: "#efe6ff", emblem: <><rect x="6" y="8" width="14" height="13" fill="#ff5d5d" /><rect x="6" y="25" width="14" height="13" fill="#ffb23f" /><rect x="6" y="42" width="14" height="13" fill="#ffe14d" /><path d="M24 14.5 H58 M24 31.5 H50 M24 48.5 H42" {...S} strokeWidth={6} /></> },
  duel: { pattern: "rays", font: "black-ops", c2: "#fff0e0", emblem: <><path d="M10 10 L46 46 M54 10 L18 46" {...S} strokeWidth={5} /><path d="M40 52 L52 40 M24 52 L12 40" {...S} strokeWidth={5} stroke="var(--c2)" /><circle cx="32" cy="28" r="4" fill="currentColor" /></> },
  badges: { pattern: "dots", font: "cinzel", c2: "#fff3cc", emblem: <><path d="M20 6 L26 24 M44 6 L38 24" {...S} strokeWidth={5} stroke="var(--c2)" /><circle cx="32" cy="38" r="17" {...S} /><path d="M32 28 l3 6.2 6.8 1 -4.9 4.7 1.2 6.8 -6.1 -3.2 -6.1 3.2 1.2 -6.8 -4.9 -4.7 6.8 -1z" fill="currentColor" /></> },
  classement: { pattern: "grid", font: "cinzel", c2: "#e9c46a", emblem: <><rect x="24" y="22" width="16" height="34" fill="currentColor" /><rect x="6" y="34" width="16" height="22" fill="currentColor" opacity=".7" /><rect x="42" y="40" width="16" height="16" fill="currentColor" opacity=".5" /><path d="M26 10 H38 L36 18 H28 Z M32 18 V22" fill="var(--c2)" stroke="var(--c2)" strokeWidth="2" /></> },
};

export function Emblem({ id, size = 64 }: { id: string; size?: number }) {
  const art = GAME_ART[id];
  if (!art) return null;
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" style={{ "--c2": art.c2 } as React.CSSProperties}>{art.emblem}</svg>;
}
