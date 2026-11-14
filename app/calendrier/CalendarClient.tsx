"use client";

// Calendrier des sorties Crunchyroll : la semaine jour par jour (fuseau du
// visiteur), l'épisode à venir le plus proche en grand, puis les autres en cartes
// (affiche, bannière, synopsis français, lien Crunchyroll, fans de la Guilde).
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Play } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import WordReveal from "../components/WordReveal";
import type { AiringEpisode } from "../../lib/airing";
import "./calendar.css";

const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function countdown(at: number, now: number): string {
  const s = at - Math.floor(now / 1000);
  if (s <= 0) return "Disponible";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h >= 24 ? `Dans ${Math.floor(h / 24)} j ${h % 24} h` : h ? `Dans ${h} h ${String(m).padStart(2, "0")}` : `Dans ${m} min`;
}

function Fans({ e }: { e: AiringEpisode }) {
  if (!e.followers.length) return null;
  return (
    <span className="cal-fans">
      {e.followers.slice(0, 5).map((f) => (
        <Link key={f.id} href={`/membres/${f.id}`} className="cal-fan" title={`${f.name} suit cette série`}>
          {f.image ? <Image src={f.image} alt={f.name} fill sizes="34px" /> : f.name.slice(0, 1)}
        </Link>
      ))}
      <small>{e.followers.length === 1 ? `${e.followers[0].name} suit` : `${e.followers.length} membres suivent`}</small>
    </span>
  );
}

export default function CalendarClient({ episodes }: { episodes: AiringEpisode[] | null }) {
  const [now, setNow] = useState<number | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => { void Promise.resolve().then(() => {
    const t = Date.now(); setNow(t);
    // ?serie=<id AniList> : ouvert depuis la recherche, on va au jour de l'épisode.
    const asked = Number(new URLSearchParams(location.search).get("serie"));
    const hit = asked ? (episodes ?? []).find((e) => e.mediaId === asked) : undefined;
    setDay(dayKey(new Date(hit ? hit.at * 1000 : t)));
    if (hit) { setFocus(hit.mediaId); setTimeout(() => document.getElementById(`cal-${hit.mediaId}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 160); }
  }); }, [episodes]);
  // Compte à rebours : mise à jour chaque minute.
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);

  const days = useMemo(() => {
    const map = new Map<string, { date: Date; list: AiringEpisode[] }>();
    for (const e of episodes ?? []) {
      const d = new Date(e.at * 1000);
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, { date: d, list: [] });
      map.get(k)!.list.push(e);
    }
    return [...map.entries()].map(([k, v]) => ({ key: k, ...v }));
  }, [episodes]);

  const current = days.find((d) => d.key === day) ?? days[0];
  const list = (current?.list ?? []).filter((e) => !mine || e.followers.length);
  // À la une : le prochain épisode du jour (sinon le plus populaire).
  const upcoming = now === null ? [] : list.filter((e) => e.at * 1000 > now);
  const featured = upcoming[0] ?? [...list].sort((a, b) => b.popularity - a.popularity)[0];
  const rest = list.filter((e) => e !== featured);
  const followedCount = (episodes ?? []).filter((e) => e.followers.length).length;

  return (
    <div className="gk-page tone-dark cal-page">
      <GuildeHeader activePage="calendrier" tone="dark" />
      <main className="gk-wrap cal-main">
        <header className="cal-head">
          <span className="gk-chapter"><b>✦</b><span>HŌSŌ · SIMULCAST</span></span>
          <h1 className="gk-display cal-title"><WordReveal>Les sorties <em>Crunchyroll.</em></WordReveal></h1>
          <p className="cal-lede">Les épisodes de la semaine sur Crunchyroll, jour par jour et à ton heure (heure de diffusion au Japon ; la mise en ligne suit en général de près).</p>
        </header>

        {!episodes ? (
          <p className="cal-empty" role="alert">Le calendrier est indisponible pour le moment. Réessaie dans quelques minutes.</p>
        ) : (
          <>
            <nav className="cal-days" aria-label="Jours de la semaine">
              {days.map((d) => (
                <button key={d.key} type="button" className="cal-day" aria-pressed={d.key === current?.key} onClick={() => setDay(d.key)}>
                  <b>{now !== null && d.key === dayKey(new Date(now)) ? "Aujourd'hui" : DAY.format(d.date)}</b>
                  <small>{DATE.format(d.date)} · {d.list.length} épisode{d.list.length > 1 ? "s" : ""}</small>
                </button>
              ))}
            </nav>
            <div className="cal-tools">
              <div className="gk-switch" role="group" aria-label="Filtrer">
                <button type="button" aria-pressed={!mine} onClick={() => setMine(false)}>Toute la semaine</button>
                <button type="button" aria-pressed={mine} onClick={() => setMine(true)}>Suivis par la Guilde ({followedCount})</button>
              </div>
            </div>

            {!featured ? (
              <p className="cal-empty">{mine ? "Aucune série suivie par la Guilde ce jour-là." : "Aucun épisode ce jour-là."}</p>
            ) : (
              <div key={`${current?.key}-${mine}`} className="cal-day-view">
                <article id={`cal-${featured.mediaId}`} className={`cal-hero${focus === featured.mediaId ? " is-focus" : ""}`} style={{ "--c": featured.color ?? "#f47521", "--bn": featured.banner ? `url(${JSON.stringify(featured.banner)})` : "none" } as React.CSSProperties}>
                  <div className="cal-hero-bg" aria-hidden="true" />
                  <div className="cal-hero-poster">{featured.cover && <Image src={featured.cover} alt={`Affiche de ${featured.title}`} fill sizes="(max-width: 700px) 40vw, 260px" priority />}</div>
                  <div className="cal-hero-body">
                    <p className="cal-hero-kicker">{now !== null && featured.at * 1000 > now ? "Prochain épisode" : "À la une du jour"}</p>
                    <h2 className="gk-display">{featured.title}</h2>
                    {featured.titleAlt && <p className="cal-alt">{featured.titleAlt}</p>}
                    <p className="cal-chips">
                      <span className="cal-chip is-time"><Clock size={14} aria-hidden="true" /> {now === null ? "··:··" : TIME.format(new Date(featured.at * 1000))}</span>
                      <span className="cal-chip is-ep">Épisode {featured.episode}{featured.total ? ` / ${featured.total}` : ""}</span>
                      {now !== null && <span className="cal-chip">{countdown(featured.at, now)}</span>}
                      {featured.genres.map((g) => <span key={g} className="cal-chip">{g}</span>)}
                    </p>
                    <p className="cal-syn">{featured.synopsis ?? "Synopsis français indisponible pour cette série."}</p>
                    <div className="cal-hero-actions">
                      <a className="cal-cr" href={featured.crunchyroll} target="_blank" rel="noopener noreferrer"><Play size={18} aria-hidden="true" /> Regarder sur Crunchyroll</a>
                      <Fans e={featured} />
                    </div>
                  </div>
                </article>

                {rest.length > 0 && (
                  <ol className="cal-grid">
                    {rest.map((e, i) => {
                      const aired = now !== null && e.at * 1000 <= now;
                      return (
                        <li key={`${e.mediaId}-${e.episode}`} id={`cal-${e.mediaId}`} className={`cal-card${aired ? " is-aired" : ""}${focus === e.mediaId ? " is-focus" : ""}${e.followers.length ? " is-followed" : ""}`}
                          style={{ "--i": Math.min(i, 14), "--c": e.color ?? "#f47521", "--bn": e.banner ? `url(${JSON.stringify(e.banner)})` : "none" } as React.CSSProperties}>
                          <div className="cal-card-bn" aria-hidden="true" />
                          <div className="cal-card-poster">{e.cover && <Image src={e.cover} alt="" fill sizes="120px" />}</div>
                          <div className="cal-card-body">
                            <p className="cal-chips">
                              <span className="cal-chip is-time"><Clock size={13} aria-hidden="true" /> {now === null ? "··:··" : TIME.format(new Date(e.at * 1000))}</span>
                              <span className="cal-chip is-ep">Ép. {e.episode}</span>
                              {now !== null && <span className="cal-chip">{aired ? "Disponible" : countdown(e.at, now)}</span>}
                            </p>
                            <h3>{e.title}</h3>
                            <p className="cal-card-syn">{e.synopsis ?? "Synopsis français indisponible."}</p>
                            <div className="cal-card-foot">
                              <a className="cal-cr is-sm" href={e.crunchyroll} target="_blank" rel="noopener noreferrer" aria-label={`Regarder ${e.title} sur Crunchyroll`}><Play size={14} aria-hidden="true" /> Crunchyroll</a>
                              <Fans e={e} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
            <p className="cal-credit">Horaires de diffusion : AniList. Disponibilité sur Crunchyroll : liens officiels recensés par AniList (le catalogue peut varier selon le pays). Synopsis : TMDB. Ce site n&apos;est pas affilié à Crunchyroll.</p>
          </>
        )}
      </main>
    </div>
  );
}
