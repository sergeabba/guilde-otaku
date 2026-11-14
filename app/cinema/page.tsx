import type { Metadata } from "next";
import { getCinemaRows, type CinemaItem } from "../../lib/cinema";
import CinemaClient from "./CinemaClient";

export const metadata: Metadata = {
  title: "Cinéma Otaku | Guilde Otaku",
  description: "Les animes japonais à voir légalement en France : bandes-annonces, plateformes incluses dans l'abonnement ou gratuites.",
};

/** Une série au hasard parmi les dix plus populaires qui ont une image et un synopsis. */
function pickHero(series: CinemaItem[]): CinemaItem | null {
  const candidates = series.filter((i) => i.backdrop && i.overview).slice(0, 10);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export default async function CinemaPage() {
  const rows = await getCinemaRows().catch(() => null);
  // Affiche à la une : tirée au hasard parmi les séries populaires qui ont une image et un synopsis.
  const hero = pickHero(rows?.series ?? []);
  return <CinemaClient rows={rows} hero={hero} />;
}
