"use client";

// Les notes de la semaine : les épisodes d'anime diffusés ces 7 derniers jours,
// classés par la note des spectateurs (TMDB). Bandes déchirées, image de l'épisode,
// note qui défile jusqu'à sa valeur à l'apparition.
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import type { EpisodeRating } from "../../lib/ratings";

function Score({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 900);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 3)) * 10) / 10);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      setShown(0);
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref} className="wr-score-n">{shown.toFixed(1)}</span>;
}

const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function WeeklyRatings({ ratings }: { ratings: EpisodeRating[] }) {
  if (ratings.length < 3) return null;
  return (
    <section className="wr gk-wrap" aria-labelledby="wr-title">
      <header className="wr-head">
        <h2 id="wr-title" className="gk-display">Les notes de la semaine</h2>
        <p>Les épisodes diffusés ces 7 derniers jours, notés par les spectateurs (TMDB)</p>
      </header>
      <ol className="wr-list">
        {ratings.map((r, i) => (
          <li key={`${r.tmdbId}-${r.episode}`} className="wr-band" style={{ "--still": r.still ? `url(${JSON.stringify(r.still)})` : "none", "--i": i } as React.CSSProperties}>
            <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`${r.title}, ${r.season ? `${r.season}, ` : ""}épisode ${r.episode} : ${r.score} sur 10 (${r.votes} votes)`}>
              <span className="wr-rank" aria-hidden="true">{i + 1}</span>
              <span className="wr-info">
                <span className="wr-ep">{r.season ? `${r.season} · ` : ""}Épisode {r.episode}</span>
                <span className="wr-score"><Star size={34} aria-hidden="true" fill="currentColor" /><Score value={r.score} /><small>/10</small></span>
                <span className="wr-name">{r.title}</span>
                <span className="wr-votes">{r.votes} vote{r.votes > 1 ? "s" : ""} · {DAY.format(new Date(r.airedAt))}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <p className="wr-credit">Notes des spectateurs TMDB (souvent peu de votes en début de diffusion). Calendrier : AniList.</p>
    </section>
  );
}
