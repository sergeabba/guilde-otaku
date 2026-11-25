import type { Metadata } from "next";
import Link from "next/link";
import "./a/a.css";

export const metadata: Metadata = { title: "Exploration artistique · trois directions | Guilde Otaku" };

// Sommaire de l'exploration : trois directions radicalement différentes, à comparer.
const DIRS = [
  { k: "A", href: "/explo/a", name: "La planche vivante", lang: "Manga éditorial expérimental", what: "La page est une planche : cases diagonales, personnages qui débordent, onomatopées, bulles. Navigation par onglets de tranche. Bankai piloté par le défilement.", member: "/explo/a/membre/4" },
  { k: "B", href: "/explo/b", name: "Grand menu", lang: "Interface de JRPG", what: "L'accueil est un menu principal, chaque rubrique a son hôte. Sélection d'équipe, écran de statut, incrustation du bankai, territoire qui change toute l'interface.", member: "/explo/b/membre/4" },
  { k: "C", href: "/explo/c", name: "Butai", lang: "Cinéma immersif WebGL", what: "Une scène WebGL fixe traversée au défilement : trame, fondus à l'encre, grain. Chaque membre a son film, du portrait anime à la photo réelle.", member: "/explo/c/membre/4" },
];

export default function Explo() {
  return (
    <main className="xe" data-explo="/explo">
      <h1>Trois directions</h1>
      <p>Prototypes d&apos;exploration sur les vraies données de la Guilde. Chaque direction a son accueil, sa navigation et sa page de membre.</p>
      <ol>
        {DIRS.map((d) => (
          <li key={d.k}>
            <b>{d.k}</b>
            <div><h2>{d.name}</h2><small>{d.lang}</small><p>{d.what}</p>
              <p className="xe-links"><Link href={d.href}>Accueil →</Link><Link href={d.member}>Un membre →</Link></p></div>
          </li>
        ))}
      </ol>
    </main>
  );
}
