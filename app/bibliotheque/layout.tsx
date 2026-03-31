import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "La Bibliothèque | Guilde Otaku",
  description: "Les verdicts définitifs de la Guilde. Retrouvez nos reviews d'animes, mangas, films, séries et jeux vidéo jugés sans pitié, ainsi que la fameuse Chronique du Bash !",
  openGraph: {
    title: "La Bibliothèque - Guilde Otaku",
    description: "Les verdicts définitifs de la Guilde. Reviews d'animes et dossiers exclusifs jugés sans pitié.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "https://image.tmdb.org/t/p/original/lvndABJgYFihAGocI1hPgqv7yxu.jpg",
        width: 1200,
        height: 630,
        alt: "Aperçu de la Bibliothèque - Chronique du Bash",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Bibliothèque | Guilde Otaku",
    description: "Découvrez les verdicts définitifs de la Guilde Otaku.",
    images: ["https://image.tmdb.org/t/p/original/lvndABJgYFihAGocI1hPgqv7yxu.jpg"],
  },
};

export default function BibliothequeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
