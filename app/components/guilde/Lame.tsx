// La lame : brique de base de l'interface de la Guilde. Un quadrilatère irrégulier
// (jamais deux angles identiques), stable pour un même texte, doublé d'une dalle d'ombre
// décalée. Sert aux titres, aux entrées de menu, aux boutons et aux étiquettes.
// Rendu serveur ; le texte reste du vrai texte (sélectionnable, lu par les lecteurs d'écran).
import type { ElementType, ReactNode } from "react";

export type LameTone = "ink" | "paper" | "red" | "gold" | "acc";

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

/** Polygone de découpe déterministe : chaque coin bouge de 0 à `amp` %. */
export function lameClip(seed: string, amp = 6): string {
  const h = hash(seed);
  const j = (k: number) => ((h >> (k * 3)) % (amp + 1));
  return `polygon(${j(0)}% ${j(1)}%, ${100 - j(2)}% ${j(3) / 2}%, 100% ${100 - j(4)}%, ${j(5) / 2}% 100%)`;
}

export default function Lame({ children, seed, tone = "ink", shadow = "red", tilt, as: Tag = "span", className = "", style, ...rest }: {
  children: ReactNode; seed?: string; tone?: LameTone; shadow?: LameTone | "none"; tilt?: number; as?: ElementType; className?: string; style?: React.CSSProperties;
} & Record<string, unknown>) {
  const key = seed ?? (typeof children === "string" ? children : "lame");
  const h = hash(key);
  const rot = tilt ?? ((h % 7) - 4) * 0.9;
  return (
    <Tag className={`lame is-${tone} ${className}`} style={{ "--lame-clip": lameClip(key), "--lame-clip-s": lameClip(key + "·", 8), "--lame-rot": `${rot}deg`, ...style } as React.CSSProperties} {...rest}>
      {shadow !== "none" && <span className={`lame-shadow is-${shadow}`} aria-hidden="true" />}
      <span className="lame-face">{children}</span>
    </Tag>
  );
}
