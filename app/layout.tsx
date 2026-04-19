import type { Metadata } from "next";
import "./globals.css";

import BirthdayBanner from "./components/BirthdayBanner";

export const metadata: Metadata = {
  metadataBase: new URL('https://guilde-otaku.vercel.app'), 
  title: "Guilde Otaku",
  description: "Le trombinoscope légendaire de la Guilde Otaku — Membres, combats, bibliothèque et plus encore.",
  openGraph: {
    title: "Guilde Otaku",
    description: "Le trombinoscope légendaire de la Guilde Otaku — Membres, combats, bibliothèque et plus encore.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Guilde Otaku - Trombinoscope",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guilde Otaku",
    description: "Le trombinoscope légendaire de la Guilde Otaku.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700;1,900&family=Barlow:wght@300;400;500;600&family=Bebas+Neue&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* === BANNIÈRE D'ANNIVERSAIRE === */}
        {/* Elle s'affichera automatiquement sur toutes les pages le jour J */}
        <BirthdayBanner />
        
        {/* Le reste du site */}
        {children}
      </body>
    </html>
  );
}