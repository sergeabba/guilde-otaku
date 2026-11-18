import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
// Polices auto-hébergées (public/fonts) : le build ne dépend plus de Google Fonts.
import "./styles/fonts.css";
import "./globals.css";
import "./styles/shonen.css";
import "./styles/motion.css";
import "./styles/music.css";
import "./styles/works-public.css";

import BirthdayBanner from "./components/BirthdayBanner";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import MotionDirector from "./components/MotionDirector";
import RouteTransitions from "./components/RouteTransitions";
import MotionSettings from "./components/MotionSettings";
import CommandPalette from "./components/CommandPalette";
import SplashWrapper from "./components/SplashWrapper";
import { ThemeProvider } from "./context/ThemeContext";
import { MusicDockProvider } from "./components/MusicDock";

// Android : barre du navigateur aux couleurs du site, clavier qui redimensionne la page
// (les champs restent visibles).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0e13" },
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
  ],
};

export const metadata: Metadata = {
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/apple-icon-180.png", sizes: "180x180" }] },
  appleWebApp: { capable: true, title: "Guilde", statusBarStyle: "black" },
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
  const isMobileVisitor = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

  // A blocking intro is expensive on mobile: visitors reach content immediately.
  // « Revoir l'intro » (pied de page) la redemande explicitement, téléphone compris.
  const forceSplash = !isBot && cookieStore.get("guilde-splash-force")?.value === "1";
  const hasSeenSplash = !forceSplash && (isBot || isMobileVisitor || cookieStore.get("guilde-splash-seen")?.value === "1");

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        {/* Police de l'interface et du texte courant, visibles dès le premier écran. */}
        <link rel="preload" href="/fonts/barlow-condensed/barlow-condensed-latin-700-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/barlow/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#contenu" className="gk-skip">Aller au contenu</a>
        <ThemeProvider>
          <MotionSettings>
          <MusicDockProvider>
          <BirthdayBanner />
          <SplashWrapper hasSeenSplash={hasSeenSplash}>
            <div id="contenu" tabIndex={-1}>{children}</div>
            <Footer />
          </SplashWrapper>
          <CommandPalette />
          <BackToTop />
          <MotionDirector />
          <RouteTransitions />
          </MusicDockProvider>
          </MotionSettings>
        </ThemeProvider>
      </body>
    </html>
  );
}