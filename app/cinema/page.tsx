import { pageMetadata } from "../../lib/og/page-meta";
import { getCinemaRows, type CinemaItem } from "../../lib/cinema";
import { driveFolder, getGuildVideos, type GuildCollection } from "../../lib/drive";
import CinemaClient from "./CinemaClient";

export async function generateMetadata() {
  return pageMetadata("cinema", "/cinema", "Le Cinéma Otaku", "Bandes-annonces, vidéos de la Guilde et où regarder les animes en France.");
}

/** Une série au hasard parmi les dix plus populaires qui ont une image et un synopsis. */
function pickHero(series: CinemaItem[]): CinemaItem | null {
  const candidates = series.filter((i) => i.backdrop && i.overview).slice(0, 10);
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export default async function CinemaPage() {
  const [rows, guild] = await Promise.all([
    getCinemaRows().catch(() => null),
    // Le lien du dossier suffit : vidéos lues dans la vue publique de Drive (ou l'API si une clé existe).
    driveFolder()
      ? getGuildVideos().then((c): { collections: GuildCollection[]; error?: string } => ({ collections: c })).catch((e: unknown) => ({ collections: [] as GuildCollection[], error: e instanceof Error ? e.message : "Google Drive indisponible." }))
      : Promise.resolve(null),
  ]);
  // Affiche à la une : tirée au hasard parmi les séries populaires qui ont une image et un synopsis.
  const hero = pickHero(rows?.series ?? []);
  return <CinemaClient rows={rows} hero={hero} guild={guild} />;
}
