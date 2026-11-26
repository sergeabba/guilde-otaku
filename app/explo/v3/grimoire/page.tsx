import type { Metadata } from "next";
import { v3Data } from "../../../../lib/home-v3";
import Sceau from "../../../components/guilde/Sceau";
import Phylactere from "../../../components/guilde/Phylactere";
import { Cadre } from "../../../components/guilde/Ornement";
import { brushMask } from "../../../components/guilde/textures";
import { rankRomaji, type Rank } from "../../../config/ranks";
import "../v3.css";

export const metadata: Metadata = { title: "DA v3 · H2 Grimoire | Guilde Otaku" };

// Prototype H2 « Grimoire » : la Guilde comme un ouvrage enluminé qu'on manipule.
// Double page de papier : à gauche, le membre de couverture peint (masque au pinceau) sur le
// sceau doré de son grade ; à droite, la table des arcanes (les rubriques en constellation,
// reliées comme un arbre de progression). Téléphone : une seule page, la constellation
// devient un chemin vertical.
const NODES: [number, number][] = [[50, 12], [24, 30], [76, 30], [40, 50], [64, 52], [18, 70], [50, 78], [82, 72]];

export default async function H2() {
  const d = await v3Data();
  const star = d.members.find((m) => m.id === d.entries[0].host)!;
  const src = star.anime ?? star.real;
  const links = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [3, 5], [3, 6], [4, 6], [4, 7]];
  return (
    <main className="v3 gr gu-night">
      <article className="gr-book gu-paper">
        <Cadre />
        <section className="gr-page is-left" aria-label="Couverture">
          <p className="gr-kicker">Hebdo n°{d.week} · {d.date.day} {d.date.num} {d.date.month}</p>
          <h1 className="gr-title"><span>Le grimoire</span><span>de la Guilde</span></h1>
          <figure className="gr-figure">
            <Sceau className="gr-seal" rank={star.rank} text={rankRomaji[star.rank as Rank]} tone="gold" size="100%" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {src && <img className="gr-portrait" src={src} alt={`${star.name}, version anime`} style={{ WebkitMaskImage: brushMask(7, 6), maskImage: brushMask(7, 6) }} />}
            <figcaption><Phylactere tone="red">{star.name}</Phylactere><small>{star.rank}</small></figcaption>
          </figure>
          {star.lede && <p className="gr-lede gu-lettrine">{star.lede}</p>}
        </section>
        <section className="gr-page is-right" aria-labelledby="gr-toc">
          <h2 id="gr-toc" className="gr-toc-h"><Phylactere tone="ink">Table des arcanes</Phylactere></h2>
          <div className="gr-tree">
            <svg className="gr-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {links.map(([a, b]) => <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />)}
            </svg>
            <ol>
              {d.entries.map((e, i) => (
                <li key={e.id} style={{ "--x": `${NODES[i][0]}%`, "--y": `${NODES[i][1]}%` } as React.CSSProperties}>
                  <a href={e.href}>
                    <Sceau rubric={e.rubric} tone={i === 0 ? "red" : "ink"} size="100%" />
                    <span className="gr-node-label">{e.label}</span>
                    <small>{e.why}</small>
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <p className="gr-count">{d.count} nakama · {d.ranks} grades · depuis 2020</p>
        </section>
      </article>
    </main>
  );
}
