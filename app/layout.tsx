import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

import BirthdayBanner from "./components/BirthdayBanner";
import SplashWrapper from "./components/SplashWrapper";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSeenSplash = cookieStore.get("guilde-splash-seen")?.value === "1";

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700;1,900&family=Barlow:wght@300;400;500;600&family=Bebas+Neue&family=Cinzel+Decorative:wght@700;900&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* === BANNIÈRE D'ANNIVERSAIRE === */}
        {/* Elle s'affichera automatiquement sur toutes les pages le jour J */}
        <BirthdayBanner />
        
        {/* === SPLASH SCREEN FAIRY TAIL === */}
        <SplashWrapper hasSeenSplash={hasSeenSplash}>
          {children}
        </SplashWrapper>
      </body>
    </html>
  );
}