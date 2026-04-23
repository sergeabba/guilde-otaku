import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wanted | Guilde Otaku",
  description: "Les primes de la Guilde Otaku ! Retrouve tous les membres sous forme de wanted posters avec leurs mises à prix.",
  openGraph: {
    title: "Wanted - Guilde Otaku",
    description: "Les primes de la Guilde Otaku ! Wanted posters et mises à prix des membres.",
    siteName: "Guilde Otaku",
    images: [
      {
        url: "https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/wanted?v=3",
        width: 1200,
        height: 630,
        alt: "Wanted Posters - Guilde Otaku",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanted | Guilde Otaku",
    description: "Les primes de la Guilde Otaku ! Wanted posters et mises à prix.",
    images: ["https://image.thum.io/get/width/1200/crop/630/delay/3000/noanimate/https://guilde-otaku.vercel.app/wanted?v=3"],
  },
};

export default function WantedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
