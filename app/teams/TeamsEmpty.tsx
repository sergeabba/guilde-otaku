// État vide de Teams : le tableau tactique est déjà tracé (terrain de foot à onze, demi-terrain
// de basket à cinq), les postes attendent leurs joueurs. Rien d'inventé : seulement les postes
// génériques de chaque sport, aucun nom ni statistique.
import Sceau from "../components/guilde/Sceau";
import Lame from "../components/guilde/Lame";

const FOOT: [number, number, string][] = [
  [50, 90, "Gardien"], [18, 70, "Latéral"], [38, 74, "Défense"], [62, 74, "Défense"], [82, 70, "Latéral"],
  [30, 50, "Milieu"], [50, 54, "Milieu"], [70, 50, "Milieu"], [20, 26, "Ailier"], [50, 20, "Avant-centre"], [80, 26, "Ailier"],
];
const BASKET: [number, number, string][] = [[50, 82, "Meneur"], [20, 60, "Arrière"], [80, 60, "Ailier"], [32, 30, "Ailier fort"], [68, 30, "Pivot"]];

function Board({ kind, slots, title }: { kind: "foot" | "basket"; slots: [number, number, string][]; title: string }) {
  return (
    <figure className={`te-board is-${kind}`}>
      <svg className="te-field" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {kind === "foot" ? (<>
          <rect x="3" y="3" width="94" height="94" fill="none" />
          <line x1="3" y1="50" x2="97" y2="50" /><circle cx="50" cy="50" r="11" fill="none" />
          <rect x="26" y="82" width="48" height="15" fill="none" /><rect x="26" y="3" width="48" height="15" fill="none" />
        </>) : (<>
          <rect x="3" y="3" width="94" height="94" fill="none" />
          <path d="M14 97 V70 A36 36 0 0 1 86 70 V97" fill="none" /><rect x="36" y="62" width="28" height="35" fill="none" />
          <circle cx="50" cy="62" r="12" fill="none" /><circle cx="50" cy="91" r="2.5" />
        </>)}
      </svg>
      {slots.map(([x, y, label], i) => (
        <span key={i} className="te-slot" style={{ left: `${x}%`, top: `${y}%` }}>
          <Sceau rubric="teams" tone="ink" size={38} />
          <small>{label}</small>
        </span>
      ))}
      <figcaption><Lame tone="paper" shadow="acc" seed={title}>{title}</Lame></figcaption>
    </figure>
  );
}

export default function TeamsEmpty({ available }: { available: boolean }) {
  return (
    <section className="te" aria-label="Équipes à venir">
      <p className="te-lede">{available ? "La Guilde prépare ses compositions : les postes sont tracés, les joueurs arrivent." : "Les équipes ne sont pas encore publiées. Le tableau tactique est prêt."}</p>
      <div className="te-boards">
        <Board kind="foot" slots={FOOT} title="Le onze de foot" />
        <Board kind="basket" slots={BASKET} title="Le cinq de basket" />
      </div>
    </section>
  );
}
