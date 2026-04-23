import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "L'Atelier | Guilde Otaku",
  description: "La galerie expérimentale de la Guilde Otaku. Créations visuelles générées par Intelligence Artificielle, design cinématique et art numérique.",
  openGraph: {
    title: "L'Atelier - Guilde Otaku",
    description: "La galerie expérimentale de la Guilde Otaku. Créations visuelles générées par IA.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/api/og?title=L'Atelier&subtitle=Galerie%20Expérimentale%20d'Intelligence%20Artificielle",
        width: 1200,
        height: 630,
        alt: "L'Atelier Visuel - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "L'Atelier | Guilde Otaku",
    description: "La galerie expérimentale de la Guilde Otaku. Créations visuelles par IA.",
    images: ["/api/og?title=L'Atelier&subtitle=Galerie%20Expérimentale%20d'Intelligence%20Artificielle"],
  },
};

export default function AtelierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
