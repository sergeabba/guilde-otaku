// Marque de rubrique : l'emblème (sceau) de la rubrique en grand, placé selon la rubrique
// (chaque page a sa composition), et une étiquette en lame avec son numéro et son nom.
// Remplace l'ancien repère de chapitre identique sur toutes les pages. Rendu serveur.
import Sceau from "./Sceau";
import Lame from "./Lame";

export default function RubricMark({ rubric, no, label, romaji, tone = "paper" }: { rubric: string; no: string; label: string; romaji?: string; tone?: "paper" | "red" | "ink" | "gold" }) {
  return (
    <>
      <span className={`rm-big rm-${rubric}`} aria-hidden="true"><Sceau rubric={rubric} text={romaji ?? label} tone={tone} size="100%" /></span>
      <p className="rm-tag">
        <Sceau rubric={rubric} tone={tone === "paper" ? "ink" : tone} size={40} />
        <Lame tone="ink" shadow="acc" seed={rubric} tilt={-3}><b className="rm-no">{no}</b>{label}</Lame>
        {romaji && <span className="rm-romaji">{romaji}</span>}
      </p>
    </>
  );
}
