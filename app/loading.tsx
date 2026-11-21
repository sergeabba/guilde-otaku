// Chargement d'une page : l'emblème de la Guilde se dessine d'un coup de pinceau,
// entouré de traits de vitesse. Sans mouvement avec « réduire les animations ».
export default function Loading() {
  return (
    <div className="gk-page gk-loading" role="status" aria-label="Chargement de la page">
      <div className="gk-loading-mark" aria-hidden="true">
        <span className="gk-loading-burst" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emblem.png" alt="" width={120} height={120} />
      </div>
      <p className="gk-loading-text" aria-hidden="true">Chargement</p>
    </div>
  );
}
