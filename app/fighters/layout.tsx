import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arène | Guilde Otaku",
  description: "Sélectionne tes combattants et affronte les membres de la Guilde dans des duels épiques ! Stats, spéciales et K.O. garantis.",
  openGraph: {
    title: "Arène - Guilde Otaku",
    description: "Sélectionne tes combattants et affronte les membres de la Guilde dans des duels épiques !",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Arène de Combat - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arène | Guilde Otaku",
    description: "Sélectionne tes combattants et affronte les membres de la Guilde !",
    images: ["/logo.png"],
  },
};

export default function FightersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
