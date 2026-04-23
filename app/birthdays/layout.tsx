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
        url: "https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/birthdays",
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
    images: ["https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/birthdays"],
  },
};

export default function BirthdaysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
