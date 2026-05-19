import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import {
  Barlow_Condensed,
  Barlow,
  Bebas_Neue,
  Orbitron,
  Black_Ops_One,
  Cinzel_Decorative,
} from "next/font/google";
import "./globals.css";

import BirthdayBanner from "./components/BirthdayBanner";
import Footer from "./components/Footer";
import SplashWrapper from "./components/SplashWrapper";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-barlow-condensed",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-barlow",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bebas-neue",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-orbitron",
});

const blackOpsOne = Black_Ops_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-black-ops-one",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  variable: "--font-cinzel-decorative",
});

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
        alt: "Guilde Otaku - Aperçu",
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
  const headersList = await headers();
  const userAgent = headersList.get("user-agent")?.toLowerCase() || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|thum|headless|lighthouse/i.test(userAgent);

  const hasSeenSplash = isBot || cookieStore.get("guilde-splash-seen")?.value === "1";

  return (
    <html lang="fr" className={`${barlowCondensed.variable} ${barlow.variable} ${bebasNeue.variable} ${orbitron.variable} ${blackOpsOne.variable} ${cinzelDecorative.variable}`}>
      <body>
        {/* === BANNIÈRE D'ANNIVERSAIRE === */}
        {/* Elle s'affichera automatiquement sur toutes les pages le jour J */}
        <BirthdayBanner />
        
        {/* === SPLASH SCREEN FAIRY TAIL === */}
        <SplashWrapper hasSeenSplash={hasSeenSplash}>
          {children}
          <Footer />
        </SplashWrapper>
      </body>
    </html>
  );
}