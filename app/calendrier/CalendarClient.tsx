"use client";

// Semaine de diffusion, regroupée par jour dans le fuseau du visiteur.
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import WordReveal from "../components/WordReveal";
import type { AiringEpisode } from "../../lib/airing";
import "./calendar.css";

const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function CalendarClient({ episodes }: { episodes: AiringEpisode[] | null }) {
  // Heure et fuseau du visiteur : connus seulement dans le navigateur.
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
    if (hit) { setFocus(hit.mediaId); setTimeout(() => document.getElementById(`cal-${hit.mediaId}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 120); }
  }); }, [episodes]);

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

  const followedCount = (episodes ?? []).filter((e) => e.followers.length).length;
  const current = days.find((d) => d.key === day) ?? days[0];
  const list = (current?.list ?? []).filter((e) => !mine || e.followers.length);

  return (
    <div className="gk-page tone-dark cal-page">
      <GuildeHeader activePage="calendrier" tone="dark" />
      <main className="gk-wrap cal-main">
        <header className="cal-head">
          <span className="gk-chapter"><b>✦</b><span>HŌSŌ · LA SEMAINE</span></span>
          <h1 className="gk-display cal-title"><WordReveal>Calendrier des <em>sorties.</em></WordReveal></h1>
          <p className="cal-lede">Les épisodes diffusés au Japon cette semaine, à ton heure. Les séries suivies par la Guilde portent les visages de leurs fans.</p>
        </header>

        {!episodes ? (
          <p className="cal-empty" role="alert">Le calendrier est indisponible pour le moment (AniList ne répond pas). Réessaie dans quelques minutes.</p>
        ) : (
          <>
            <nav className="cal-days" aria-label="Jours de la semaine">
              {days.map((d) => (
                <button key={d.key} type="button" className="cal-day" aria-pressed={d.key === current?.key} onClick={() => setDay(d.key)}>
                  <b>{now !== null && d.key === dayKey(new Date(now)) ? "Aujourd'hui" : DAY.format(d.date)}</b>
                  <small>{DATE.format(d.date)} · {d.list.length}</small>
                </button>
              ))}
            </nav>
            <div className="cal-tools">
              <div className="gk-switch" role="group" aria-label="Filtrer">
                <button type="button" aria-pressed={!mine} onClick={() => setMine(false)}>Tous</button>
                <button type="button" aria-pressed={mine} onClick={() => setMine(true)}>Suivis par la Guilde ({followedCount})</button>
              </div>
            </div>

            {list.length === 0 ? (
              <p className="cal-empty">{mine ? "Aucune série suivie par la Guilde ce jour-là." : "Aucun épisode ce jour-là."}</p>
            ) : (
              <ol className="cal-list" key={`${current?.key}-${mine}`}>
                {list.map((e, i) => {
                  const aired = now !== null && e.at * 1000 < now;
                  return (
                    <li key={`${e.mediaId}-${e.episode}`} id={`cal-${e.mediaId}`} className={`cal-item${aired ? " is-aired" : ""}${e.followers.length ? " is-followed" : ""}${focus === e.mediaId ? " is-focus" : ""}`} style={{ "--i": Math.min(i, 12), "--c": e.color ?? "#c9a84c" } as React.CSSProperties}>
                      <time className="cal-time" dateTime={new Date(e.at * 1000).toISOString()}>{now === null ? "··:··" : TIME.format(new Date(e.at * 1000))}</time>
                      <span className="cal-cover">
                        {e.cover && <Image src={e.cover} alt="" fill sizes="88px" />}
                      </span>
                      <div className="cal-body">
                        <strong>{e.title}</strong>
                        {e.titleAlt && <small>{e.titleAlt}</small>}
                        <span className="cal-meta">
                          <span className="cal-ep">Épisode {e.episode}{e.total ? ` / ${e.total}` : ""}</span>
                          {e.genres.map((g) => <span key={g}>{g}</span>)}
                          {aired && <span className="cal-aired">Diffusé</span>}
                        </span>
                        {e.followers.length > 0 && (
                          <span className="cal-fans">
                            {e.followers.slice(0, 5).map((f) => (
                              <Link key={f.id} href={`/membres/${f.id}`} className="cal-fan" title={`${f.name} suit cette série`}>
                                {f.image ? <Image src={f.image} alt={f.name} fill sizes="32px" /> : f.name.slice(0, 1)}
                              </Link>
                            ))}
                            <small>{e.followers.length === 1 ? `${e.followers[0].name} suit` : `${e.followers.length} membres suivent`}</small>
                          </span>
                        )}
                      </div>
                      <a className="cal-link" href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`Fiche AniList de ${e.title}`}><ExternalLink size={16} aria-hidden="true" /></a>
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="cal-credit">Horaires de diffusion japonais fournis par AniList. Les épisodes arrivent ensuite sur les plateformes françaises (voir le Cinéma).</p>
          </>
        )}
      </main>
    </div>
  );
}
