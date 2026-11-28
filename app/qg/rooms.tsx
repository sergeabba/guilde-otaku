// Les salles du Quartier général, dessinées en SVG (décor original, aucune image reprise).
// Une salle = un plan en coupe (mur du fond, papier peint, plancher en perspective,
// fenêtre sur la nuit, mobilier), à l'encre noire et en aplats façon manga, avec des
// hachures pour les ombres. Les personnages et les images (affiches, couvertures) sont
// posés par-dessus en HTML, à partir des vraies données de la Guilde.
import type { ReactNode } from "react";

export type RoomKind = "toit" | "trone" | "musee" | "cinema" | "biblio" | "arcade" | "fete" | "vestiaire" | "atelier";

const INK = "#0d0c10";
const S = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Générateur pseudo-aléatoire stable (même dessin à chaque rendu, serveur et client). */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

function Hatch({ id, color = INK, gap = 14, angle = 45, w = 2.4 }: { id: string; color?: string; gap?: number; angle?: number; w?: number }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
      <line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={w} />
    </pattern>
  );
}

/** Coque commune : mur, motif mural, plinthe, plancher en perspective, poutre, fenêtre. */
function Shell({ k, wall, wall2, floor, floor2, motif, windowX = 1240, children }: {
  k: RoomKind; wall: string; wall2: string; floor: string; floor2: string; motif: ReactNode; windowX?: number | null; children: ReactNode;
}) {
  return (
    <svg className="qg-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`${k}-motif`} width="120" height="120" patternUnits="userSpaceOnUse">{motif}</pattern>
        <Hatch id={`${k}-hatch`} />
        <linearGradient id={`${k}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141238" /><stop offset="1" stopColor="#2a2463" /></linearGradient>
      </defs>
      <rect width="1600" height="720" fill={wall} />
      <rect width="1600" height="720" fill={`url(#${k}-motif)`} />
      <rect y="0" width="1600" height="60" fill={wall2} {...S} />
      {windowX !== null && (
        <g>
          <rect x={windowX} y="150" width="250" height="300" fill={`url(#${k}-sky)`} {...S} />
          <circle cx={windowX + 170} cy="235" r="46" fill="#f6efd2" />
          <circle cx={windowX + 186} cy="226" r="40" fill="#2a2463" opacity=".35" />
          {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={windowX + 30 + i * 47} cy={190 + ((i * 37) % 90)} r="3" fill="#fff" />)}
          <path d={`M${windowX + 125} 150 V450 M${windowX} 300 H${windowX + 250}`} {...S} />
          <rect x={windowX - 20} y="446" width="290" height="22" fill={wall2} {...S} />
        </g>
      )}
      <rect y="690" width="1600" height="34" fill={wall2} {...S} />
      <polygon points="0,724 1600,724 1600,900 0,900" fill={floor} />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={i * 133} y1="724" x2={(i * 133 - 800) * 1.6 + 800} y2="900" stroke={floor2} strokeWidth="5" />)}
      <line x1="0" y1="790" x2="1600" y2="790" stroke={floor2} strokeWidth="4" />
      <line x1="0" y1="850" x2="1600" y2="850" stroke={floor2} strokeWidth="4" />
      <line x1="0" y1="724" x2="1600" y2="724" {...S} />
      {children}
    </svg>
  );
}

const lamp = (x: number, y = 60, c = "#ffd66b") => (
  <g>
    <line x1={x} y1={y} x2={x} y2={y + 90} {...S} strokeWidth={4} />
    <path d={`M${x - 46} ${y + 150} L${x - 26} ${y + 90} H${x + 26} L${x + 46} ${y + 150} Z`} fill={c} {...S} />
  </g>
);

function Toit() {
  const r = rng(7);
  return (
    <svg className="qg-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="toit-sky" cx=".72" cy=".22" r=".9"><stop offset="0" stopColor="#3a2f7a" /><stop offset=".45" stopColor="#17133d" /><stop offset="1" stopColor="#07061a" /></radialGradient>
        <Hatch id="toit-hatch" color="#000" />
      </defs>
      <rect width="1600" height="900" fill="url(#toit-sky)" />
      {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={Math.round(r() * 1600)} cy={Math.round(r() * 520)} r={Math.round((r() * 2.4 + .6) * 10) / 10} fill="#fff" opacity={Math.round((r() * .6 + .3) * 100) / 100} />)}
      {/* La lune, énorme, comme sur les écrans titres. */}
      <circle className="qg-moon" cx="1160" cy="250" r="190" fill="#f3ead0" />
      <circle cx="1100" cy="210" r="28" fill="#e2d6b2" /><circle cx="1230" cy="300" r="42" fill="#e2d6b2" /><circle cx="1180" cy="170" r="14" fill="#e2d6b2" />
      {/* La ville au loin, fenêtres allumées. */}
      {Array.from({ length: 22 }, (_, i) => { const w = Math.round(60 + r() * 70), h = Math.round(120 + r() * 260), x = i * 74 - 20; return (
        <g key={i}><rect x={x} y={900 - h - 120} width={w} height={h + 140} fill="#0a0920" />
          {Array.from({ length: Math.floor(h / 34) }, (_, j) => r() > .55 && <rect key={j} x={x + 12 + (j % 2) * 26} y={900 - h - 100 + j * 30} width="12" height="14" fill="#ffd66b" opacity=".85" />)}</g>
      ); })}
      {/* Le toit de la Guilde : rambarde, château d'eau, lunette, enseigne. */}
      <rect x="0" y="770" width="1600" height="130" fill="#1b1830" {...S} />
      {Array.from({ length: 33 }, (_, i) => <line key={i} x1={i * 50} y1="700" x2={i * 50} y2="770" {...S} strokeWidth={5} stroke="#2e2a4d" />)}
      <line x1="0" y1="700" x2="1600" y2="700" stroke="#2e2a4d" strokeWidth="8" />
      <g transform="translate(150 470)">
        <rect x="0" y="70" width="190" height="160" fill="#3b3560" {...S} /><rect x="0" y="70" width="190" height="160" fill="url(#toit-hatch)" opacity=".35" />
        <path d="M-10 70 L95 10 L200 70 Z" fill="#4a4378" {...S} />
        {[20, 170].map((x) => <line key={x} x1={x} y1="230" x2={x - 10} y2="300" {...S} />)}
      </g>
      <g transform="translate(560 560) rotate(-24)">
        <rect x="0" y="0" width="210" height="58" rx="10" fill="#c9a84c" {...S} />
        <rect x="200" y="-6" width="40" height="70" rx="6" fill="#8f6d1f" {...S} />
        <path d="M70 58 L40 200 M140 58 L170 200 M105 58 V200" {...S} transform="rotate(24 105 58)" />
      </g>
    </svg>
  );
}

function Trone({ ranks }: { ranks: { color: string }[] }) {
  return (
    <Shell k="trone" wall="#3a1220" wall2="#5c1a2e" floor="#1c0d14" floor2="#2d1520" windowX={null}
      motif={<path d="M60 10 L70 50 L110 60 L70 70 L60 110 L50 70 L10 60 L50 50 Z" fill="#4a1828" />}>
      {/* Bannières des grades, à leurs vraies couleurs. */}
      {ranks.slice(0, 9).map((r, i) => { const x = 90 + i * 160; return (
        <g key={i}><path d={`M${x} 60 H${x + 90} V330 L${x + 45} 290 L${x} 330 Z`} fill={r.color} {...S} /><path d={`M${x + 45} 110 l10 24 26 2 -20 16 7 26 -23 -14 -23 14 7 -26 -20 -16 26 -2 z`} fill={INK} opacity=".55" /></g>
      ); })}
      {/* Estrade et trône. */}
      <path d="M520 724 L580 640 H1020 L1080 724 Z" fill="#7a1f33" {...S} />
      <path d="M560 680 H1040" {...S} strokeWidth={4} />
      <path d="M690 640 V380 Q800 300 910 380 V640 Z" fill="#c9a84c" {...S} />
      <path d="M720 640 V410 Q800 350 880 410 V640 Z" fill="#7a1f33" {...S} />
      <rect x="660" y="560" width="280" height="80" fill="#c9a84c" {...S} />
      <circle cx="800" cy="360" r="26" fill="#f6d77a" {...S} />
      {/* Tapis rouge jusqu'au bord de la case. */}
      <path d="M740 724 H860 L960 900 H640 Z" fill="#b3203d" {...S} />
      <path d="M760 724 L680 900 M840 724 L920 900" stroke="#e9c46a" strokeWidth="6" />
    </Shell>
  );
}

function Musee() {
  return (
    <Shell k="musee" wall="#e9dcc0" wall2="#b89a62" floor="#6b4a2a" floor2="#553820" windowX={null}
      motif={<g fill="none" stroke="#d6c39c" strokeWidth="3"><rect x="10" y="10" width="100" height="100" /><rect x="35" y="35" width="50" height="50" /></g>}>
      {/* Cadres (le portrait du record est posé dans le grand). */}
      <rect x="560" y="110" width="480" height="470" fill="#5b3a1a" {...S} />
      <rect x="590" y="140" width="420" height="410" fill="#f3e3bf" {...S} />
      {[140, 1180].map((x) => <g key={x}><rect x={x} y="170" width="280" height="330" fill="#5b3a1a" {...S} /><rect x={x + 26} y="196" width="228" height="278" fill="#f3e3bf" {...S} /></g>)}
      {/* Spots du musée. */}
      {[800, 280, 1320].map((x) => <path key={x} d={`M${x - 30} 60 h60 l-12 34 h-36 z`} fill="#2b2b2b" {...S} />)}
      {/* Socles, cordon. */}
      {[300, 1300].map((x) => <g key={x}><rect x={x - 70} y="590" width="140" height="134" fill="#d9cba8" {...S} /><rect x={x - 90} y="570" width="180" height="26" fill="#c2b28a" {...S} /></g>)}
      <path d="M520 700 Q800 780 1080 700" fill="none" stroke="#b3203d" strokeWidth="10" />
      {[520, 1080].map((x) => <g key={x}><rect x={x - 10} y="640" width="20" height="84" fill="#c9a84c" {...S} /><circle cx={x} cy="636" r="16" fill="#c9a84c" {...S} /></g>)}
      <rect x="690" y="590" width="220" height="44" fill="#c9a84c" {...S} />
    </Shell>
  );
}

function Cinema() {
  return (
    <Shell k="cinema" wall="#1b1330" wall2="#2d2050" floor="#120c20" floor2="#1d1532" windowX={null}
      motif={<path d="M0 60 Q30 20 60 60 T120 60" fill="none" stroke="#241a3d" strokeWidth="6" />}>
      {/* Rideaux et écran (le film élu est projeté dessus). */}
      <path d="M0 60 H260 Q220 400 260 724 H0 Z" fill="#8a1530" {...S} />
      <path d="M1600 60 H1340 Q1380 400 1340 724 H1600 Z" fill="#8a1530" {...S} />
      {[40, 110, 180, 1420, 1490, 1560].map((x) => <path key={x} d={`M${x} 70 Q${x + 10} 400 ${x} 720`} stroke="#5c0d20" strokeWidth="8" fill="none" />)}
      <rect x="330" y="110" width="940" height="470" fill="#efe8d8" {...S} />
      {/* Fauteuils vus de dos. */}
      {[0, 1].map((row) => Array.from({ length: 9 }, (_, i) => { const x = 60 + i * 180 + row * 90, y = 700 + row * 110; return (
        <g key={`${row}-${i}`}><path d={`M${x} ${y + 80} V${y + 10} Q${x + 70} ${y - 30} ${x + 140} ${y + 10} V${y + 80} Z`} fill={row ? "#6d1027" : "#8a1530"} {...S} /></g>
      ); }))}
    </Shell>
  );
}

function Biblio({ seed = 3 }: { seed?: number }) {
  const r = rng(seed);
  const spines = ["#c8102e", "#e9c46a", "#2563eb", "#2fbf5a", "#7c3aed", "#f97316", "#f3eee2", "#0ea5e9"];
  return (
    <Shell k="biblio" wall="#2a1d14" wall2="#4a3220" floor="#3a2716" floor2="#2b1c10" windowX={1300}
      motif={<rect x="0" y="0" width="120" height="120" fill="none" stroke="#33241a" strokeWidth="4" />}>
      {/* Deux grandes étagères garnies de tranches. */}
      {[60, 640].map((sx) => (
        <g key={sx}>
          <rect x={sx} y="80" width="520" height="644" fill="#5b3a1f" {...S} />
          {[0, 1, 2, 3].map((sh) => { let x = sx + 22; const y = 110 + sh * 150; const books: ReactNode[] = []; while (x < sx + 490) { const w = Math.round(22 + r() * 26), h = Math.round(90 + r() * 34); books.push(<rect key={x} x={x} y={y + 124 - h} width={w} height={h} fill={spines[Math.floor(r() * spines.length)]} stroke={INK} strokeWidth="4" />); x += w + 3; } return <g key={sh}>{books}<rect x={sx} y={y + 124} width="520" height="22" fill="#4a2e16" {...S} /></g>; })}
        </g>
      ))}
      {/* Échelle. */}
      <g transform="rotate(-12 1200 724)"><path d="M1160 160 V724 M1240 160 V724" {...S} strokeWidth={8} />{[220, 320, 420, 520, 620].map((y) => <line key={y} x1="1160" y1={y} x2="1240" y2={y} {...S} />)}</g>
      {lamp(1430, 60)}
    </Shell>
  );
}

function Arcade() {
  const cols = ["#f5a524", "#f472b6", "#38bdf8", "#e8412c"];
  return (
    <Shell k="arcade" wall="#0f0b24" wall2="#1d1640" floor="#160f2e" floor2="#2a1f52" windowX={null}
      motif={<g fill="none" strokeWidth="3"><path d="M0 0 L120 120 M120 0 L0 120" stroke="#1a1438" /></g>}>
      {/* Enseigne au néon. */}
      <rect x="560" y="90" width="480" height="120" rx="20" fill="#0a0818" stroke="#f472b6" strokeWidth="8" />
      <text x="800" y="182" textAnchor="middle" fontSize="92" fill="#ffe1f0" stroke="#f472b6" strokeWidth="3" style={{ fontFamily: "Anton, sans-serif", letterSpacing: "12px" }}>ASOBI</text>
      {/* Bornes d'arcade (leurs écrans brillent aux couleurs des jeux). */}
      {cols.map((c, i) => { const x = 120 + i * 360; return (
        <g key={i} className="qg-cab" style={{ "--c": c } as React.CSSProperties}>
          <path d={`M${x} 724 V330 L${x + 30} 250 H${x + 230} L${x + 260} 330 V724 Z`} fill="#231c46" {...S} />
          <rect x={x + 30} y="250" width="200" height="56" fill={c} {...S} />
          <rect className="qg-cab-screen" x={x + 40} y="330" width="180" height="150" fill={c} opacity=".85" {...S} />
          <rect x={x + 10} y="500" width="240" height="70" fill="#2f2660" {...S} />
          <circle cx={x + 70} cy="530" r="14" fill="#e8412c" {...S} /><circle cx={x + 120} cy="530" r="14" fill="#e9c46a" {...S} /><circle cx={x + 170} cy="530" r="14" fill="#38bdf8" {...S} />
          <line x1={x + 210} y1="535" x2={x + 220} y2="505" {...S} /><circle cx={x + 220} cy="503" r="10" fill="#e8412c" {...S} />
        </g>
      ); })}
    </Shell>
  );
}

function Fete({ color }: { color: string }) {
  const r = rng(11);
  return (
    <Shell k="fete" wall="#f6e7d4" wall2="#e2b77a" floor="#a0663c" floor2="#86522e" windowX={1290}
      motif={<g><circle cx="20" cy="20" r="6" fill="#f3c8c0" /><circle cx="80" cy="70" r="6" fill="#c9e3f3" /><circle cx="40" cy="100" r="5" fill="#f3e3a0" /></g>}>
      {/* Guirlande de fanions, aux couleurs du grade de la personne fêtée. */}
      <path d="M0 110 Q800 230 1600 110" fill="none" {...S} strokeWidth={4} />
      {Array.from({ length: 16 }, (_, i) => { const x = i * 100 + 20, y = Math.round(110 + Math.sin((i / 15) * Math.PI) * 60); return <path key={i} d={`M${x} ${y} h64 l-32 60 z`} fill={i % 3 === 0 ? color : i % 3 === 1 ? "#f3eee2" : "#d7332b"} {...S} strokeWidth={4} />; })}
      {/* Ballons. */}
      {[[160, 300, "#d7332b"], [240, 250, color], [1460, 320, "#2563eb"]].map(([x, y, c], i) => <g key={i}><ellipse cx={x as number} cy={y as number} rx="60" ry="74" fill={c as string} {...S} /><path d={`M${x} ${(y as number) + 74} Q${(x as number) + 20} ${(y as number) + 200} ${x} 700`} fill="none" stroke={INK} strokeWidth="3" /></g>)}
      {/* Table et gâteau. */}
      <rect x="520" y="560" width="560" height="40" fill="#f3eee2" {...S} /><path d="M540 600 V724 M1060 600 V724" {...S} strokeWidth={10} />
      <rect x="640" y="440" width="320" height="120" rx="14" fill="#f3c8c0" {...S} /><rect x="690" y="370" width="220" height="80" rx="12" fill="#fff4ea" {...S} />
      {[730, 780, 830, 870].map((x, i) => <g key={x}><rect x={x} y="320" width="14" height="50" fill={i % 2 ? color : "#2563eb"} {...S} strokeWidth={3} /><path className="qg-flame" d={`M${x + 7} 296 q12 14 0 24 q-12 -10 0 -24`} fill="#ffb020" /></g>)}
      {Array.from({ length: 40 }, (_, i) => <rect key={i} x={Math.round(r() * 1600)} y={Math.round(r() * 680)} width="10" height="18" fill={["#d7332b", "#2563eb", "#e9c46a", color][i % 4]} transform={`rotate(${Math.round(r() * 90)})`} opacity=".8" />)}
    </Shell>
  );
}

function Vestiaire({ teams }: { teams: number | null }) {
  return (
    <Shell k="vestiaire" wall="#d9e2ec" wall2="#7d8ea3" floor="#4b5a6b" floor2="#3b4856" windowX={null}
      motif={<g fill="none" stroke="#c6d1dd" strokeWidth="3"><rect x="0" y="0" width="60" height="60" /><rect x="60" y="60" width="60" height="60" /></g>}>
      {/* Casiers numérotés. */}
      {Array.from({ length: 8 }, (_, i) => { const x = 80 + i * 180; return (
        <g key={i}>
          <rect x={x} y="120" width="160" height="560" fill={i % 2 ? "#2563eb" : "#1e4fc4"} {...S} />
          {[160, 180, 200].map((y) => <line key={y} x1={x + 40} y1={y} x2={x + 120} y2={y} {...S} strokeWidth={4} />)}
          <rect x={x + 120} y="380" width="14" height="60" fill="#c9d4e0" {...S} strokeWidth={3} />
          <text x={x + 80} y="300" textAnchor="middle" fontSize="70" fill="#fff" stroke={INK} strokeWidth="6" paintOrder="stroke" style={{ fontFamily: "Anton, sans-serif" }}>{i + 1}</text>
        </g>
      ); })}
      {/* Banc et ballons. */}
      <rect x="200" y="690" width="1200" height="34" fill="#a0663c" {...S} />
      <circle cx="1460" cy="790" r="70" fill="#f3eee2" {...S} /><path d="M1460 720 l20 40 -20 30 -20 -30 z M1400 770 l40 10 M1520 770 l-40 10" fill={INK} stroke={INK} strokeWidth="4" />
      <circle cx="140" cy="800" r="64" fill="#f97316" {...S} /><path d="M76 800 H204 M140 736 V864 M95 755 Q140 800 95 845 M185 755 Q140 800 185 845" fill="none" {...S} strokeWidth={4} />
      {teams === null && <text x="800" y="860" textAnchor="middle" fontSize="0">.</text>}
    </Shell>
  );
}

function Atelier() {
  return (
    <Shell k="atelier" wall="#2b2522" wall2="#3e3530" floor="#57493f" floor2="#463a32" windowX={1290}
      motif={<g fill="none" stroke="#352d29" strokeWidth="5"><path d="M0 40 H120 M0 100 H120 M40 0 V40 M90 40 V100 M30 100 V120" /></g>}>
      {/* Guirlande lumineuse. */}
      <path d="M0 90 Q400 170 800 100 T1600 110" fill="none" stroke={INK} strokeWidth="3" />
      {Array.from({ length: 20 }, (_, i) => <circle key={i} className="qg-bulb" cx={i * 84 + 20} cy={Math.round(110 + Math.sin(i * .8) * 28)} r="11" fill="#ffd66b" {...S} strokeWidth={3} />)}
      {/* Chevalet (la création est posée dessus) et panneau de liège (les bons plans). */}
      <path d="M560 724 L700 170 L840 724 M700 170 L700 724" fill="none" {...S} strokeWidth={10} />
      <rect x="500" y="230" width="400" height="320" fill="#f3eee2" {...S} />
      <rect x="80" y="160" width="360" height="300" fill="#b9875a" {...S} />
      {[[110, 190, "#f3e3a0"], [250, 200, "#f3c8c0"], [130, 320, "#c9e3f3"], [280, 330, "#d9f3c9"]].map(([x, y, c], i) => <g key={i}><rect x={x as number} y={y as number} width="120" height="100" fill={c as string} {...S} strokeWidth={4} transform={`rotate(${i % 2 ? 4 : -5} ${(x as number) + 60} ${(y as number) + 50})`} /><circle cx={(x as number) + 60} cy={(y as number) + 10} r="8" fill="#d7332b" {...S} strokeWidth={3} /></g>)}
      {/* Pots de peinture. */}
      {[["#d7332b", 1000], ["#2563eb", 1080], ["#e9c46a", 1160]].map(([c, x]) => <g key={x as number}><rect x={x as number} y="640" width="66" height="84" fill="#9aa4b0" {...S} /><ellipse cx={(x as number) + 33} cy="640" rx="33" ry="10" fill={c as string} {...S} strokeWidth={4} /></g>)}
    </Shell>
  );
}

export function RoomArt({ kind, ranks, color, teams }: { kind: RoomKind; ranks: { color: string }[]; color: string; teams: number | null }) {
  switch (kind) {
    case "toit": return <Toit />;
    case "trone": return <Trone ranks={ranks} />;
    case "musee": return <Musee />;
    case "cinema": return <Cinema />;
    case "biblio": return <Biblio />;
    case "arcade": return <Arcade />;
    case "fete": return <Fete color={color} />;
    case "vestiaire": return <Vestiaire teams={teams} />;
    case "atelier": return <Atelier />;
  }
}
