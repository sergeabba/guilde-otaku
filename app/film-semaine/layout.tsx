import type { Metadata } from "next";
import { supabase } from "../../lib/supabase";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabase.from("film_semaine").select("*").order("week_date", { ascending: false });

  let imageUrl = "/api/og?title=Soir%C3%A9e%20Cin%C3%A9ma&subtitle=Le%20Film%20de%20la%20Semaine";
  let description = "Les films de la semaine de la Guilde Otaku. Synopsis, bandes-annonces et soirées cinéma.";
  let title = "Film de la Semaine | Guilde Otaku";

  if (data && data.length > 0) {
    const latestWeekDate = data[0].week_date;
    const currentWeekFilms = data.filter(f => f.week_date === latestWeekDate);
    const chosenFilm = currentWeekFilms.find(f => f.chosen);

    if (chosenFilm) {
      title = `${chosenFilm.title} - Film de la Semaine`;
      if (chosenFilm.synopsis) description = chosenFilm.synopsis.substring(0, 150) + "...";
      if (chosenFilm.backdrop_path) {
        imageUrl = `https://image.tmdb.org/t/p/w1280${chosenFilm.backdrop_path}`;
      } else if (chosenFilm.poster_path) {
        imageUrl = `https://image.tmdb.org/t/p/w500${chosenFilm.poster_path}`;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Guilde Otaku",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function FilmSemaineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
