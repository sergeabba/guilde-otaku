// Scène de pouvoir : l'image représente le pouvoir lui-même, pas un fond générique.
// Familles déduites du texte réel de la fiche (lib/power-scene.ts), éléments SVG générés de façon
// reproductible. Deux grammaires :
// - territoire : un monde (plans arrière, personnage placé dedans, plans avant qui le recouvrent) ;
// - bankai : une libération (éclat autour du personnage, coupe diagonale, nom en lettres découpées).
// Mouvement lent et continu, coupé en mouvement réduit ; la famille « temps » ralentit tout.
import type { ReactNode } from "react";
import { familiesOf, PALETTE, rng, type Family } from "../../../lib/power-scene";
import Ransom from "../Ransom";
import SceneDepth from "./SceneDepth";
import "../../styles/power-scene.css";

type R = () => number;
const W = 400, H = 300;

/** Éléments d'une famille. `front` : plan avant (recouvre le personnage). */
function layer(f: Family, r: R, front: boolean, burst: boolean): ReactNode[] {
  const P = PALETTE[f];
  const n = (k: number) => Array.from({ length: k }, (_, i) => i);
  const cx = burst ? 280 : 200, cy = burst ? 170 : 150;
  switch (f) {
    case "vegetation":
      return front
        ? n(26).map((i) => <ellipse key={i} className="ps-float" style={{ "--d": `${r() * 6}s` } as React.CSSProperties} cx={r() * W} cy={r() * H} rx={3 + r() * 4} ry={1.6 + r() * 2} fill={i % 3 ? P.hue : P.glow} transform={`rotate(${Math.round(r() * 180)} ${Math.round(r() * W)} ${Math.round(r() * H)})`} opacity={.85} />)
        : [...n(7).map((i) => { const x = 20 + i * 58 + r() * 20, w = 10 + r() * 16; return <path key={`t${i}`} d={`M${x} ${H} C${x + 4} ${H * .6} ${x - 6} ${H * .35} ${x + 2} 0 L${x + w} 0 C${x + w - 4} ${H * .4} ${x + w + 6} ${H * .7} ${x + w} ${H} Z`} fill={P.ink} opacity={.9} />; }),
          ...n(14).map((i) => <circle key={`c${i}`} cx={r() * W} cy={r() * 70} r={30 + r() * 40} fill={i % 2 ? P.bg : "#163521"} opacity={.9} />)];
    case "temps":
      return front ? [] : [
        ...[120, 95, 70].map((rr, k) => <g key={`r${k}`} className={k === 1 ? "ps-turn" : "ps-turn is-rev"} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={rr} fill="none" stroke={P.hue} strokeWidth={k === 0 ? 2 : 1} opacity={.7} />
          {n(60).map((t) => <line key={t} x1={cx} y1={cy - rr} x2={cx} y2={cy - rr + (t % 5 ? 4 : 10)} stroke={P.glow} strokeWidth={t % 5 ? .6 : 1.4} transform={`rotate(${t * 6} ${cx} ${cy})`} opacity={.6} />)}
        </g>),
        <line key="h1" className="ps-turn" style={{ transformOrigin: `${cx}px ${cy}px` }} x1={cx} y1={cy} x2={cx} y2={cy - 60} stroke={P.glow} strokeWidth={4} />,
      ];
    case "nuit":
      return front ? n(20).map((i) => <circle key={i} className="ps-twinkle" style={{ "--d": `${r() * 4}s` } as React.CSSProperties} cx={r() * W} cy={r() * H * .6} r={.8 + r() * 1.6} fill={P.glow} />)
        : [<circle key="m" cx={W * .78} cy={H * .26} r={44} fill={P.glow} />, <circle key="m2" cx={W * .78 + 14} cy={H * .26 - 8} r={40} fill={P.bg} opacity={burst ? 0 : .9} />,
          ...n(60).map((i) => <circle key={i} cx={r() * W} cy={r() * H * .7} r={r() * 1.2} fill="#fff" opacity={.6} />)];
    case "lumiere":
      return front ? [] : [...n(16).map((i) => <polygon key={i} className="ps-ray" points={`${cx},${cy} ${cx + Math.cos(i / 16 * Math.PI * 2) * 500},${cy + Math.sin(i / 16 * Math.PI * 2) * 500} ${cx + Math.cos((i + .45) / 16 * Math.PI * 2) * 500},${cy + Math.sin((i + .45) / 16 * Math.PI * 2) * 500}`} fill={P.hue} opacity={.35} />),
        <circle key="s" cx={cx} cy={cy} r={50} fill={P.glow} opacity={.9} />];
    case "feu":
      return front ? n(18).map((i) => <circle key={i} className="ps-rise" style={{ "--d": `${r() * 3}s` } as React.CSSProperties} cx={r() * W} cy={H - r() * 40} r={1 + r() * 2.2} fill={P.glow} />)
        : n(11).map((i) => { const x = i * 40 - 10 + r() * 10, h = 90 + r() * 120; return <path key={i} className="ps-flicker" style={{ "--d": `${r()}s`, transformOrigin: `${x + 25}px ${H}px` } as React.CSSProperties} d={`M${x} ${H} C${x} ${H - h * .5} ${x + 30} ${H - h * .6} ${x + 25} ${H - h} C${x + 50} ${H - h * .6} ${x + 60} ${H - h * .4} ${x + 52} ${H} Z`} fill={i % 2 ? P.hue : "#ff8a2a"} opacity={.9} />; });
    case "glace":
      return n(front ? 5 : 12).map((i) => { const x = r() * W, top = r() < .5, h = 60 + r() * (front ? 90 : 140), w = 14 + r() * 26; const y0 = top ? 0 : H; const dir = top ? 1 : -1;
        return <polygon key={i} points={`${x},${y0} ${x + w / 2},${y0 + dir * h} ${x + w},${y0} ${x + w * .7},${y0} ${x + w / 2},${y0 + dir * h * .6}`} fill={i % 2 ? P.hue : P.glow} opacity={front ? .55 : .8} stroke={P.ink} strokeWidth={1} />; });
    case "foudre":
      return n(front ? 2 : 4).map((i) => { let x = 40 + r() * 320, y = 0; const pts = [`${x},${y}`]; while (y < H) { x += (r() - .5) * 60; y += 20 + r() * 30; pts.push(`${x},${y}`); }
        return <polyline key={i} className="ps-flash" style={{ "--d": `${r() * 2}s` } as React.CSSProperties} points={pts.join(" ")} fill="none" stroke={i % 2 ? P.glow : P.hue} strokeWidth={front ? 3 : 5} strokeLinejoin="bevel" />; });
    case "ombre":
      return front ? n(5).map((i) => <circle key={i} className="ps-spread" style={{ "--d": `${r() * 3}s` } as React.CSSProperties} cx={i % 2 ? W * (r() * .2) : W * (.8 + r() * .2)} cy={r() * H} r={40 + r() * 60} fill="#000" filter="url(#ps-ink)" />)
        : [<rect key="v" width={W} height={H} fill="url(#ps-vig)" />];
    case "miroir":
      return front ? [] : n(7).map((i) => <rect key={i} x={i * 60 - 20 + r() * 10} y={20 + r() * 40} width={46} height={200} fill={P.hue} opacity={.18 + r() * .25} stroke={P.glow} strokeWidth={1.4} transform={`skewY(${(r() - .5) * 18})`} />);
    case "voix":
      return front ? [] : [...n(7).map((i) => <circle key={i} className="ps-pulse" style={{ "--d": `${i * .35}s`, transformOrigin: `${cx}px ${cy}px` } as React.CSSProperties} cx={cx} cy={cy} r={30 + i * 26} fill="none" stroke={P.hue} strokeWidth={2} opacity={.55} />),
        ...n(40).map((i) => { const hh = 6 + r() * 60; return <rect key={`b${i}`} x={i * 10} y={H - 20 - hh} width={5} height={hh} fill={P.glow} opacity={.35} />; })];
    case "savoir":
      return n(front ? 10 : 26).map((i) => <text key={i} className="ps-float" style={{ "--d": `${r() * 6}s` } as React.CSSProperties} x={r() * W} y={20 + r() * (H - 20)} fontSize={front ? 22 : 10 + r() * 16} fill={front ? P.glow : P.hue} opacity={front ? .8 : .5} fontFamily="Cinzel, serif">{"?%∑π0123456789AZ"[Math.floor(r() * 18)] ?? "?"}</text>);
    case "spectacle":
      return front ? [<path key="cl" d={`M0 0 H70 C60 90 70 200 40 ${H} H0 Z`} fill={P.hue} />, <path key="cr" d={`M${W} 0 H${W - 70} C${W - 60} 90 ${W - 70} 200 ${W - 40} ${H} H${W} Z`} fill={P.hue} />]
        : [0, 1].map((k) => <polygon key={k} className="ps-sweep" style={{ "--d": `${k * 1.2}s`, transformOrigin: `${k ? W * .85 : W * .15}px 0px` } as React.CSSProperties} points={`${k ? W * .85 : W * .15},0 ${cx - 60},${H} ${cx + 60},${H}`} fill={P.glow} opacity={.16} />);
    case "sport":
      return front ? n(8).map((i) => <rect key={i} x={-20} y={30 + i * 32} width={120 + r() * 160} height={2} fill={P.glow} opacity={.6} className="ps-dash" style={{ "--d": `${r()}s` } as React.CSSProperties} />)
        : [<rect key="p" width={W} height={H} fill="none" stroke={P.glow} strokeWidth={2} opacity={.35} />, <line key="m" x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={P.glow} opacity={.35} strokeWidth={2} />, <circle key="c" cx={W / 2} cy={H / 2} r={46} fill="none" stroke={P.glow} opacity={.35} strokeWidth={2} />];
    case "couleur":
      return n(front ? 6 : 14).map((i) => <circle key={i} cx={r() * W} cy={r() * H} r={front ? 8 + r() * 14 : 30 + r() * 60} fill={["#ff5fa2", "#ffd23f", "#3ec1d3", "#7c4dff", "#ff6b35"][i % 5]} opacity={front ? .9 : .55} filter="url(#ps-ink)" />);
    case "pierre":
      return n(front ? 4 : 9).map((i) => { const x = r() * W, y = H - r() * (front ? 60 : 160), s = front ? 18 : 30 + r() * 30; return <polygon key={i} points={`${x},${y - s} ${x + s * .8},${y - s * .2} ${x + s * .5},${y + s * .7} ${x - s * .5},${y + s * .7} ${x - s * .8},${y - s * .2}`} fill={i % 2 ? P.hue : P.glow} opacity={.75} stroke={P.ink} />; });
    case "fete":
      return front ? n(40).map((i) => <rect key={i} className="ps-fall" style={{ "--d": `${r() * 5}s` } as React.CSSProperties} x={r() * W} y={-10} width={4} height={8} fill={["#ffd23f", "#ff5fa2", "#3ec1d3", "#fff"][i % 4]} transform={`rotate(${r() * 90})`} />)
        : n(9).map((i) => <circle key={i} cx={i * 50} cy={24 + Math.sin(i) * 10} r={10} fill={P.hue} opacity={.85} />);
    case "royaute":
      return front ? [] : [...[140, 110].map((rr, k) => <circle key={k} cx={cx} cy={cy - 30} r={rr} fill="none" stroke={P.hue} strokeWidth={k ? 1 : 3} opacity={.6} />),
        ...n(6).map((i) => <rect key={`p${i}`} x={i < 3 ? 16 + i * 34 : W - 50 - (i - 3) * 34} y={60} width={20} height={H} fill={P.ink} opacity={.8} />)];
    case "fantome":
      return n(front ? 4 : 8).map((i) => { const x = r() * W, y = 40 + r() * 200; return <path key={i} className="ps-float" style={{ "--d": `${r() * 5}s` } as React.CSSProperties} d={`M${x} ${y} c-10 -30 30 -30 20 0 c10 20 -10 30 -6 50 c-6 -10 -10 -8 -14 0 c-4 -16 -10 -30 0 -50z`} fill={P.glow} opacity={front ? .25 : .4} />; });
    case "vitesse":
      return n(front ? 10 : 30).map((i) => <rect key={i} className="ps-dash" style={{ "--d": `${r() * .8}s` } as React.CSSProperties} x={r() * W} y={r() * H} width={60 + r() * 180} height={front ? 3 : 1.5} fill={i % 3 ? P.glow : P.hue} opacity={.7} />);
    case "vent":
      return n(front ? 4 : 9).map((i) => { const y = 30 + i * 30 + r() * 10; return <path key={i} className="ps-dash" style={{ "--d": `${r() * 2}s` } as React.CSSProperties} d={`M-20 ${y} C80 ${y - 30} 160 ${y + 30} 260 ${y} S380 ${y - 20} 440 ${y}`} fill="none" stroke={P.glow} strokeWidth={front ? 2.5 : 1.2} opacity={.55} />; });
    case "vide":
      return front ? [] : n(9).map((i) => <ellipse key={i} className="ps-turn" style={{ transformOrigin: `${cx}px ${cy}px` }} cx={cx} cy={cy} rx={20 + i * 26} ry={10 + i * 14} fill="none" stroke={P.hue} strokeWidth={1.5} opacity={.7 - i * .06} transform={`rotate(${i * 9} ${cx} ${cy})`} />);
    default: // force : éclat d'impact
      return front ? [] : n(22).map((i) => { const a = (i / 22) * Math.PI * 2, l = 120 + r() * 200; return <polygon key={i} points={`${cx},${cy} ${cx + Math.cos(a - .05) * l},${cy + Math.sin(a - .05) * l} ${cx + Math.cos(a + .05) * l},${cy + Math.sin(a + .05) * l}`} fill={P.hue} opacity={.55} />; });
  }
}

export default function PowerScene({ kind, nom, sens, effet, art, seed, id, family }: {
  /** Famille choisie à la main dans l'admin (sinon déduite du texte). */
  family?: Family;
  kind: "bankai" | "domaine" | "special"; nom: string; sens: string; effet: string; art?: string | null; seed: number; id: string;
}) {
  const auto = familiesOf(`${nom} ${sens} ${effet}`);
  const fam: Family[] = family ? [family, ...auto.filter((f) => f !== family)].slice(0, 2) : auto;
  const [a, b] = fam;
  const P = PALETTE[a];
  const r = rng(seed * 31 + (kind === "bankai" ? 7 : 3));
  const burst = kind !== "domaine";
  return (
    <section className={`ps is-${kind} ps-${a}${b ? ` ps2-${b}` : ""}`} aria-labelledby={id}
      style={{ "--ps-bg": P.bg, "--ps-hue": P.hue, "--ps-ink": P.ink, "--ps-glow": P.glow, "--ps-slow": fam.includes("temps") ? 3.2 : 1 } as React.CSSProperties}>
      <svg className="ps-world" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id="ps-ink"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed={seed % 50} /><feDisplacementMap in="SourceGraphic" scale="16" /></filter>
          <radialGradient id="ps-vig"><stop offset="30%" stopColor="transparent" /><stop offset="100%" stopColor="#000" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={P.bg} />
        {b && <g opacity={.45}>{layer(b, r, false, burst)}</g>}
        {layer(a, r, false, burst)}
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {art && <img className="ps-art" src={art} alt="" loading="lazy" decoding="async" />}
      <svg className="ps-front" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {layer(a, r, true, burst)}
      </svg>
      <SceneDepth family={a} slow={fam.includes("temps") ? 3 : 1} burst={kind !== "domaine"} />
      {kind === "special" && <span className="ps-impact" aria-hidden="true" />}
      <div className="ps-text">
        <p className="ps-kind">{kind === "bankai" ? "Bankai" : kind === "special" ? "Attaque spéciale" : "Extension du territoire"}</p>
        {kind === "bankai" ? <Ransom text={nom} as="h2" className="ps-name" /> : <h2 className="ps-name">{nom}</h2>}
        <span id={id} hidden>{nom}</span>
        <p className="ps-sens">{sens}</p>
        <p className="ps-effet">{effet}</p>
      </div>
    </section>
  );
}
