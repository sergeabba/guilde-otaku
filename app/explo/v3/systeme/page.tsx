import type { Metadata } from "next";
import Sceau from "../../../components/guilde/Sceau";
import Lame from "../../../components/guilde/Lame";
import Phylactere from "../../../components/guilde/Phylactere";
import { brushMask } from "../../../components/guilde/textures";
import { RANK_GLYPHS, RUBRIC_GLYPHS } from "../../../components/guilde/glyphs";
import { rankAccents, rankRomaji, type Rank } from "../../../config/ranks";
import { exploData } from "../../../../lib/explo-data";
import "../v3.css";

export const metadata: Metadata = { title: "DA v3 · Bibliothèque graphique | Guilde Otaku" };

const RUBRICS: [string, string][] = [["accueil", "Accueil"], ["membres", "Membres"], ["teams", "Teams"], ["wanted", "Wanted"], ["birthdays", "Anniversaires"], ["bibliotheque", "Bibliothèque"], ["cinema", "Cinéma"], ["calendrier", "Calendrier"], ["jeux", "Jeux"], ["atelier", "Futilités"], ["bons-plans", "Bons plans"], ["fighters", "Fighters"], ["film-semaine", "Film"]];

export default async function Systeme() {
  const { members } = await exploData();
  const m = members.find((x) => x.anime) ?? members[0];
  return (
    <main className="v3-spec gu-night">
      <h1 className="v3-spec-h"><Lame tone="paper" shadow="red" seed="systeme">Le Sceau et la Lame</Lame></h1>
      <p className="v3-spec-p">Bibliothèque graphique originale de la Guilde : sceaux des grades et des rubriques, lames, phylactères, masque au pinceau. Tout en SVG et CSS, sans image.</p>
      <h2 className="v3-spec-h2"><Phylactere tone="gold">Sceaux des grades</Phylactere></h2>
      <ul className="v3-spec-grid">
        {Object.keys(RANK_GLYPHS).filter((r) => r !== "Tous").map((r) => (
          <li key={r}><Sceau rank={r} text={rankRomaji[r as Rank]} tone="rank" accent={rankAccents[r as Rank]} size={120} title={r} /><b>{r}</b></li>
        ))}
      </ul>
      <h2 className="v3-spec-h2"><Phylactere tone="red">Emblèmes des rubriques</Phylactere></h2>
      <ul className="v3-spec-grid">
        {RUBRICS.filter(([k]) => RUBRIC_GLYPHS[k]).map(([k, label]) => (
          <li key={k}><Sceau rubric={k} text={label} tone={k === "wanted" || k === "fighters" ? "red" : "paper"} size={110} title={label} /><b>{label}</b></li>
        ))}
      </ul>
      <h2 className="v3-spec-h2"><Phylactere tone="paper">Lames</Phylactere></h2>
      <div className="v3-spec-lames">
        {(["ink", "paper", "red", "gold"] as const).map((t, i) => <Lame key={t} tone={t} shadow={t === "red" ? "ink" : "red"} seed={`l${i}`} style={{ fontSize: `${1.4 + i * .5}rem` }}>{["Entrer", "La Guilde", "Wanted", "Bankai"][i]}</Lame>)}
      </div>
      <h2 className="v3-spec-h2"><Phylactere tone="ink">Portrait fondu au pinceau</Phylactere></h2>
      {m.anime && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="v3-spec-brush" src={m.anime} alt={m.name} style={{ WebkitMaskImage: brushMask(5), maskImage: brushMask(5) }} />
      )}
    </main>
  );
}
