// Données factices de développement pour tester la collection de la Bibliothèque quand la
// base ne renvoie aucune fiche (lecture publique vide). Chargées seulement en dev avec
// /bibliotheque?demo=fiches ; jamais incluses en production (branche supprimée au build).
// Titres et jaquettes viennent de la Chronique ; verdicts, notes et avis sont FICTIFS.
import { DOSSIER_BASH_DATA } from "../dossier-bash";
import type { SupabaseBiblioRow } from "../../app/types";

const TIERS = ["Chef-d'œuvre", "Chef-d'œuvre", "Pépite", "Pépite", "Pépite", "Bof", "Surcoté", "A définir"];
const TYPES = ["Anime", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];

export const BIBLIO_DEMO: SupabaseBiblioRow[] = DOSSIER_BASH_DATA.slice(0, 22).map((e, i) => ({
  id: 9000 + i,
  title: e.title,
  type: TYPES[i % TYPES.length],
  tier: TIERS[i % TIERS.length],
  score: i % 8 === 7 ? undefined : 9.5 - (i % 8) * 0.8,
  synopsis: "Synopsis de démonstration (donnée factice de développement).",
  avis_guilde: "Avis de démonstration : ce texte sert uniquement à vérifier la mise en page de la collection en développement.\n\nSecond paragraphe de démonstration.",
  cover_image: e.hdCover || e.cover,
  status: i % 3 ? "Terminé" : "En cours",
  year: 2026,
  created_at: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
}));
