// Table des arcanes : le sommaire de la Guilde comme un arbre de progression enluminé
// (sceaux reliés par des filets dorés). Ordinateur : constellation sur une page de papier ;
// téléphone : chemin vertical, une rubrique par ligne, au pouce. Rendu serveur.
import Sceau from "../guilde/Sceau";
import Phylactere from "../guilde/Phylactere";
import { Cadre } from "../guilde/Ornement";
import "../../styles/table-arcanes.css";

export interface ArcaneLink { href: string; label: string; rubric: string; blurb: string }

// Douze places sur trois arcs, de la Guilde (en haut) vers les rubriques.
const NODES: [number, number][] = [[50, 9], [22, 24], [50, 30], [78, 24], [12, 48], [36, 52], [64, 52], [88, 48], [22, 76], [44, 84], [66, 84], [86, 74]];
const LINKS = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7], [4, 8], [5, 8], [5, 9], [6, 10], [7, 11], [6, 11], [9, 10]];

export default function TableArcanes({ links, title = "Table des arcanes" }: { links: ArcaneLink[]; title?: string }) {
  const n = Math.min(links.length, NODES.length);
  return (
    <section className="ta gu-paper" aria-labelledby="ta-h">
      <Cadre />
      <h2 id="ta-h" className="ta-h"><Phylactere tone="ink">{title}</Phylactere></h2>
      <div className="ta-tree">
        <svg className="ta-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {LINKS.filter(([a, b]) => a < n && b < n).map(([a, b]) => <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />)}
        </svg>
        <ol>
          {links.slice(0, n).map((l, i) => (
            <li key={l.href} style={{ "--x": `${NODES[i][0]}%`, "--y": `${NODES[i][1]}%` } as React.CSSProperties}>
              <a href={l.href}>
                <Sceau rubric={l.rubric} tone={i === 0 ? "red" : "ink"} size={88} />
                <span className="ta-label">{l.label}</span>
                <small>{l.blurb}</small>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
