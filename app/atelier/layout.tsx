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
        url: "https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/atelier",
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
    images: ["https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/atelier"],
  },
};

export default function AtelierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
