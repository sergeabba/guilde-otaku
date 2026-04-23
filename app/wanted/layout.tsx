import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wanted | Guilde Otaku",
  description: "Les primes de la Guilde Otaku ! Retrouve tous les membres sous forme de wanted posters avec leurs mises à prix.",
  openGraph: {
    title: "Wanted - Guilde Otaku",
    description: "Les primes de la Guilde Otaku ! Wanted posters et mises à prix des membres.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/api/og?title=Avis%20de%20Recherche&subtitle=S%C3%A9lectionnez%20votre%20prime",
        width: 1200,
        height: 630,
        alt: "Wanted Posters - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanted | Guilde Otaku",
    description: "Les primes de la Guilde Otaku ! Wanted posters et mises à prix.",
    images: ["/api/og?title=Avis%20de%20Recherche&subtitle=S%C3%A9lectionnez%20votre%20prime"],
  },
};

export default function WantedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
