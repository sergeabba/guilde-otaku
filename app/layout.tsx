import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guilde Otaku",
  description: "Le trombinoscope légendaire de la Guilde Otaku",
  openGraph: {
    images: ['/logo.png'], // Assure-toi que ce fichier existe dans /public
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
         
         href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700;1,900&family=Barlow:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}