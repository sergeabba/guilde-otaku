// Coin ornemental (registre héraldique) : filets doubles, volute et étoile. Quatre coins
// suffisent à faire d'une surface une page d'ouvrage. SVG original.
import { starPoints } from "./glyphs";

export function Coin({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`orn-coin ${className}`} viewBox="0 0 80 80" aria-hidden="true" style={style}>
      <path d="M4 76 V4 H76" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M11 76 V11 H76" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M11 40 C11 22 22 11 40 11" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 40 C18 26 26 18 40 18 C34 22 30 28 30 34 C30 38 33 40 36 40" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <polygon points={starPoints(4, 7, 2.2, 11, 11, -90)} fill="currentColor" />
      <circle cx="40" cy="11" r="2" fill="currentColor" /><circle cx="11" cy="40" r="2" fill="currentColor" />
    </svg>
  );
}

/** Cadre de page : quatre coins orientés. */
export function Cadre({ className = "" }: { className?: string }) {
  return (
    <span className={`orn-cadre ${className}`} aria-hidden="true">
      <Coin className="is-tl" /><Coin className="is-tr" /><Coin className="is-bl" /><Coin className="is-br" />
    </span>
  );
}
