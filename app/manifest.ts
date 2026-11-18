import type { MetadataRoute } from "next";

// Manifeste : sur Android, « Ajouter à l'écran d'accueil » installe la Guilde comme une
// application (plein écran, sans barre d'adresse, icône dédiée).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guilde Otaku",
    short_name: "Guilde",
    description: "Membres, jeux, bibliothèque et cinéma de la Guilde Otaku.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0e13",
    theme_color: "#0f0e13",
    categories: ["entertainment", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Jeux", url: "/jeux", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Wanted", url: "/wanted", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Cinéma", url: "/cinema", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
