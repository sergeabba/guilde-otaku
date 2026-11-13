import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import {
  Barlow_Condensed,
  Barlow,
  Bebas_Neue,
  Orbitron,
  Black_Ops_One,
  Cinzel_Decorative,
  Bricolage_Grotesque,
  Caveat,
  Dela_Gothic_One,
} from "next/font/google";
import "./globals.css";
import "./styles/shonen.css";

import BirthdayBanner from "./components/BirthdayBanner";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import CommandPalette from "./components/CommandPalette";
import SplashWrapper from "./components/SplashWrapper";
import { ThemeProvider } from "./context/ThemeContext";

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
  preload: false,
  variable: "--font-bebas-neue",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  preload: false,
  variable: "--font-orbitron",
});

const blackOpsOne = Black_Ops_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-black-ops-one",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  preload: false,
  variable: "--font-cinzel-decorative",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-bricolage",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-caveat",
});

// Police de couverture : gothique japonaise lourde, latin + kana/kanji.
const delaGothic = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-dela",
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
    <html lang="fr" className={`${barlowCondensed.variable} ${barlow.variable} ${bebasNeue.variable} ${orbitron.variable} ${blackOpsOne.variable} ${cinzelDecorative.variable} ${bricolageGrotesque.variable} ${caveat.variable} ${delaGothic.variable}`}>
      <body>
        <a href="#contenu" className="gk-skip">Aller au contenu</a>
        <ThemeProvider>
          <BirthdayBanner />
          <SplashWrapper hasSeenSplash={hasSeenSplash}>
            <div id="contenu">{children}</div>
            <Footer />
          </SplashWrapper>
          <CommandPalette />
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}