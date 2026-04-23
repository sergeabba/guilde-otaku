import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anniversaires | Guilde Otaku",
  description: "Le calendrier des anniversaires de la Guilde Otaku. Ne rate jamais l'anniversaire d'un membre !",
  openGraph: {
    title: "Anniversaires - Guilde Otaku",
    description: "Le calendrier des anniversaires de la Guilde Otaku.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/api/og?title=Anniversaires&subtitle=Le%20Calendrier%20Otaku",
        width: 1200,
        height: 630,
        alt: "Calendrier des Anniversaires - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anniversaires | Guilde Otaku",
    description: "Le calendrier des anniversaires de la Guilde Otaku.",
    images: ["/api/og?title=Anniversaires&subtitle=Le%20Calendrier%20Otaku"],
  },
};

export default function BirthdaysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
