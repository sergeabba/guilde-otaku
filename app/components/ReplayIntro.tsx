"use client";

// « Revoir l'intro » : l'introduction n'est jouée qu'une fois par jour (et jamais
// d'office sur téléphone). Ce bouton la redemande explicitement, puis recharge l'accueil.
export default function ReplayIntro() {
  return (
    <button
      type="button"
      className="gk-footer-replay"
      onClick={() => {
        document.cookie = "guilde-splash-seen=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "guilde-splash-force=1; path=/; max-age=300; SameSite=Lax";
        window.location.assign("/");
      }}
    >
      Revoir l&apos;intro
    </button>
  );
}
