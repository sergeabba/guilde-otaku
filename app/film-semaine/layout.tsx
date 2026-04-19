import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Film de la Semaine | Guilde Otaku",
  description: "Les films de la semaine de la Guilde Otaku. Synopsis, bandes-annonces et programmation de nos soirées cinéma sur Discord.",
  openGraph: {
    title: "Film de la Semaine - Guilde Otaku",
    description: "Les films de la semaine de la Guilde Otaku. Synopsis, bandes-annonces et soirées cinéma.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Film de la Semaine - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Film de la Semaine | Guilde Otaku",
    description: "Les films de la semaine de la Guilde Otaku. Soirées cinéma sur Discord.",
    images: ["/logo.png"],
  },
};

export default function FilmSemaineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
