/**
 * Terme japonais affiché en rōmaji (alphabet latin), avec son équivalent français.
 * Le site n'affiche jamais d'écriture japonaise : ce composant est le seul point
 * d'entrée pour ces libellés décoratifs.
 */
export default function RomajiLabel({
  romaji,
  fr,
  className = "",
  inline = false,
}: {
  romaji: string;
  /** Équivalent français, lu par les lecteurs d'écran et affiché en sous-titre. */
  fr?: string;
  className?: string;
  /** Sur une seule ligne : « Rōmaji · français » au lieu de deux lignes. */
  inline?: boolean;
}) {
  return (
    <span className={`gk-romaji${inline ? " is-inline" : ""} ${className}`}>
      <span className="gk-romaji-ja" lang="ja-Latn">{romaji}</span>
      {fr && <span className="gk-romaji-fr">{fr}</span>}
    </span>
  );
}
