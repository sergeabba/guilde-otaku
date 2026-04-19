import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bons Plans | Guilde Otaku",
  description: "Les archives secrètes de la Guilde : streams, scans, films, séries et astuces otaku. Tous les bons plans en un seul endroit.",
  openGraph: {
    title: "Bons Plans - Guilde Otaku",
    description: "Les archives secrètes de la Guilde : streams, scans, films et astuces otaku.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Bons Plans Otaku - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bons Plans | Guilde Otaku",
    description: "Les archives secrètes de la Guilde : streams, scans et astuces otaku.",
    images: ["/logo.png"],
  },
};

export default function BonsPlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
