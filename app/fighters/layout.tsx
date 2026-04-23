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
        url: "/api/og?title=Ar%C3%A8ne%20de%20Combat&subtitle=Duels%20L%C3%A9gendaires&image=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Foriginal%2Fn43enHnUfE5CofB413W0I31NUXD.jpg",
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
    images: ["/api/og?title=Ar%C3%A8ne%20de%20Combat&subtitle=Duels%20L%C3%A9gendaires&image=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Foriginal%2Fn43enHnUfE5CofB413W0I31NUXD.jpg"],
  },
};

export default function FightersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
