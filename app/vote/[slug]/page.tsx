import type { Metadata } from "next";
import GuildeHeader from "../../components/GuildeHeader";
import FilmPoll from "../../components/FilmPoll";
import { pollBySlug, results } from "../../../lib/film-polls";
import { isOpen } from "../../../lib/film-poll-logic";

// Page partageable d'un vote de film : /vote/<slug>. Résultats en direct côté navigateur.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const poll = await pollBySlug(slug).catch(() => null);
  if (!poll) return { title: "Vote | Guilde Otaku" };
  const description = `Vote pour le film : ${poll.films.map((f) => f.title).join(", ")}. Résultats en direct.`;
  const image = { url: `/api/og/vote?slug=${encodeURIComponent(slug)}`, width: 1200, height: 630, type: "image/jpeg", alt: poll.title };
  return {
    title: `${poll.title} | Guilde Otaku`, description, alternates: { canonical: `/vote/${slug}` },
    openGraph: { title: `${poll.title} · Guilde Otaku`, description, url: `/vote/${slug}`, siteName: "Guilde Otaku", images: [image], locale: "fr_FR", type: "website" },
    twitter: { card: "summary_large_image", title: poll.title, description, images: [image.url] },
  };
}

/** État de départ (résultats à l'instant de la requête) ; le navigateur prend ensuite le relais. */
async function initialState(slug: string) {
  const poll = await pollBySlug(slug).catch(() => null);
  if (!poll) return { poll: null };
  const r = await results(poll).catch(() => null);
  return { poll, open: isOpen(poll), now: Date.now(), tally: r?.tally, mine: null };
}

export default async function VotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initial = await initialState(slug);
  return (
    <div className="gk-page">
      <GuildeHeader activePage="film-semaine" />
      <main className="gk-wrap" style={{ paddingBlock: "clamp(20px, 4vw, 48px) 96px" }}>
        <FilmPoll slug={slug} initial={initial} />
      </main>
    </div>
  );
}
