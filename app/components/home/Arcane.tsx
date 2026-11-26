// Arcane : la carte d'un membre (registre « relations » des JRPG, dessin propre à la Guilde).
// Numéro romain gravé, champ à la couleur du grade semé d'étoiles, personnage détouré qui
// déborde par le haut, nom sur phylactère, sceau du grade en pied.
import type { ExploMember } from "../../../lib/explo-data";
import Sceau from "../guilde/Sceau";
import Phylactere from "../guilde/Phylactere";
import { starTile } from "../guilde/textures";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export default function Arcane({ m, n, href }: { m: ExploMember; n: number; href: string }) {
  const src = m.cut?.src ?? m.anime ?? m.real;
  return (
    <a className={`arc${m.cut ? "" : " is-plain"}`} href={href} style={{ "--arc-c": m.accent, "--arc-tile": starTile("rgba(0,0,0,.22)", 26) } as React.CSSProperties} aria-label={`${m.name}, ${m.rank}`}>
      <span className="arc-frame" aria-hidden="true"><span className="arc-field" /></span>
      <span className="arc-n" aria-hidden="true">{ROMAN[(n - 1) % ROMAN.length]}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img className="arc-img" src={src} alt="" loading="eager" decoding="async" />}
      <span className="arc-name"><Phylactere tone="paper">{m.first}</Phylactere></span>
      <Sceau className="arc-seal" rank={m.rank} tone="rank" accent={m.accent} size={46} />
    </a>
  );
}
