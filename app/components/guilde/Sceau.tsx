// Sceau de la Guilde : l'emblème héraldique d'un grade ou d'une rubrique. Deux anneaux,
// un texte gravé sur le pourtour (rōmaji ou nom), quatre clous, le glyphe au centre.
// SVG pur, rendu serveur, net à toutes les tailles. Le nom accessible est passé par `title`.
import { RANK_GLYPHS, RUBRIC_GLYPHS, starPoints } from "./glyphs";

type Tone = "gold" | "ink" | "paper" | "red" | "rank";

const TONES: Record<Exclude<Tone, "rank">, { fg: string; bg: string; ring: string }> = {
  gold: { fg: "#e9c46a", bg: "#120f0a", ring: "#e9c46a" },
  ink: { fg: "#0d0c10", bg: "#f4efe4", ring: "#0d0c10" },
  paper: { fg: "#f4efe4", bg: "#0d0c10", ring: "#f4efe4" },
  red: { fg: "#fff7ee", bg: "#c8102e", ring: "#fff7ee" },
};

export default function Sceau({ rank, rubric, text, tone = "gold", accent, size = 96, title, className = "" }: {
  rank?: string; rubric?: string; text?: string; tone?: Tone; accent?: string; size?: number | string; title?: string; className?: string;
}) {
  const t = tone === "rank" ? { fg: accent ?? "#e9c46a", bg: "#0d0c10", ring: accent ?? "#e9c46a" } : TONES[tone];
  const glyph = rank ? RANK_GLYPHS[rank] ?? RANK_GLYPHS["Tous"] : rubric ? RUBRIC_GLYPHS[rubric] : null;
  // Identifiant stable (rendu serveur et client identiques) pour le chemin du texte.
  const id = `sc-${(rank ?? rubric ?? "x").normalize("NFD").replace(/[^a-z0-9]/gi, "").toLowerCase()}-${(text ?? "").length}`;
  const words = (text ?? "").toUpperCase();
  return (
    <svg className={`sceau ${className}`} viewBox="0 0 100 100" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ color: t.fg, "--sc-bg": t.bg } as React.CSSProperties}>
      <circle cx="50" cy="50" r="48" fill={t.bg} />
      <circle cx="50" cy="50" r="46" fill="none" stroke={t.ring} strokeWidth="2" />
      <circle cx="50" cy="50" r="35" fill="none" stroke={t.ring} strokeWidth="1.2" />
      {/* Couronne de dents fines entre les anneaux (gravure). */}
      <circle cx="50" cy="50" r="43.5" fill="none" stroke={t.ring} strokeWidth="1" strokeDasharray="1 2.2" opacity=".7" />
      {words && (
        <>
          <defs><path id={id} d="M50 50 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0" /></defs>
          <text fill={t.fg} fontSize="7.4" fontWeight="800" letterSpacing="1.6" style={{ fontFamily: "var(--gk-font-ui, 'Barlow Condensed', sans-serif)" }}>
            <textPath href={`#${id}`} startOffset="25%" textAnchor="middle">{words}</textPath>
          </text>
        </>
      )}
      {[0, 90, 180, 270].map((a) => <polygon key={a} points={starPoints(4, 3.2, 1.2, 50, 8.5)} fill={t.ring} transform={`rotate(${a + 45} 50 50)`} />)}
      <g transform="translate(50 50) scale(.82) translate(-50 -50)" fill="currentColor">{glyph}</g>
    </svg>
  );
}
