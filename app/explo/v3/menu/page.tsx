import type { Metadata } from "next";
import { v3Data } from "../../../../lib/home-v3";
import PauseMenu from "../../../components/home/PauseMenu";
import Arcane from "../../../components/home/Arcane";
import Lame from "../../../components/guilde/Lame";
import Sceau from "../../../components/guilde/Sceau";
import "../v3.css";

export const metadata: Metadata = { title: "DA v3 · H1 Menu de pause | Guilde Otaku" };

// Prototype H1 : la couverture « menu de pause », puis les scènes qui remplacent les sections.
export default async function H1() {
  const d = await v3Data();
  const arcanes = d.members.filter((m) => m.cut).slice(0, 8);
  return (
    <main className="v3 gu-night">
      <PauseMenu {...d} />
      {/* Scène 2 : les arcanes des nakama (au lieu d'une grille de cartes). */}
      <section className="gu-scene is-paper v3-arcanes" aria-labelledby="v3-arc-h">
        <div className="v3-scene-head">
          <Sceau rubric="membres" tone="ink" size={74} />
          <h2 id="v3-arc-h"><Lame tone="ink" shadow="red" seed="arcanes">Les arcanes des nakama</Lame></h2>
          <p>Une carte par membre, numérotée dans l&apos;ordre du registre. Touche une carte pour ouvrir son chapitre.</p>
        </div>
        <ol className="v3-arc-fan">
          {arcanes.map((m, i) => <li key={m.id} style={{ "--i": i, "--n": arcanes.length } as React.CSSProperties}><Arcane m={m} n={i + 1} href={`/membres/${m.id}`} /></li>)}
        </ol>
      </section>
      {/* Scène 3 : le générique du jour, sur une bande rouge (aperçu de la règle des atmosphères). */}
      <section className="gu-scene is-red is-flip v3-redscene" aria-label="Exemple de scène rouge">
        <div className="v3-scene-head is-light">
          <Sceau rubric="cinema" tone="paper" size={74} />
          <h2><Lame tone="paper" shadow="ink" seed="seance">La séance de la semaine</Lame></h2>
          <p>Chaque rubrique a son atmosphère : nuit, papier ou rouge. Les scènes se chevauchent en biais au lieu de s&apos;empiler en bandes.</p>
        </div>
      </section>
    </main>
  );
}
