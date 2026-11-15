"use client";

// Tendances (V4.2 § 6) : AniList en direct, sans article ni texte inventé. Trois
// onglets (cette saison, la saison prochaine, mangas), une étagère d'affiches et une
// fiche dépliée avec synopsis français (source citée) et bande-annonce à la demande.
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Play, RefreshCw, Star } from "lucide-react";
import type { TrendingItem, TrendingResult, TrendingTab } from "../../lib/trending";
import { nextSeason, seasonLabel, seasonOf } from "../../lib/season";
import "../styles/trending.css";

const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const STAMP = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function when(it: TrendingItem): string | null {
  if (it.nextEpisode) return `Épisode ${it.nextEpisode.episode} le ${DAY.format(new Date(it.nextEpisode.at * 1000))}`;
  if (it.status === "À venir" && it.start) return `Sortie : ${it.start}`;
  return it.start ? `Depuis ${it.start}` : null;
}

export default function TrendingShelf() {
  const [tab, setTab] = useState<TrendingTab>("saison");
  const [data, setData] = useState<Partial<Record<TrendingTab, TrendingResult | "error">>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [labels] = useState(() => {
    const cur = seasonOf(new Date());
    return { saison: seasonLabel(cur), prochaine: seasonLabel(nextSeason(cur)), manga: "Mangas" } as Record<TrendingTab, string>;
  });
  const detailRef = useRef<HTMLDivElement>(null);

  // Les mises à jour d'état n'ont lieu qu'au retour de la requête (jamais pendant le rendu).
  const fetchTab = useCallback((t: TrendingTab) => {
    fetch(`/api/trending?tab=${t}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res: TrendingResult) => setData((d) => ({ ...d, [t]: res })))
      .catch(() => setData((d) => ({ ...d, [t]: "error" })));
  }, []);

  useEffect(() => { fetchTab("saison"); }, [fetchTab]);
  const retry = (t: TrendingTab) => { setData((d) => { const next = { ...d }; delete next[t]; return next; }); fetchTab(t); };
  const pick = (t: TrendingTab) => { setTab(t); setOpenId(null); setPlaying(null); if (!data[t]) fetchTab(t); };

  const res = data[tab];
  const items = res && res !== "error" ? res.items : [];
  const open = items.find((i) => i.id === openId) ?? null;

  const choose = (it: TrendingItem) => {
    setPlaying(null);
    setOpenId((id) => (id === it.id ? null : it.id));
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  return (
    <section className="tr" aria-labelledby="tr-title">
      <header className="tr-head">
        <div>
          <span className="gk-chapter"><b>✦</b><span>RYŪKŌ</span></span>
          <h2 id="tr-title" className="gk-display">Tendances</h2>
          <p>Ce qui monte en ce moment, d&apos;après les spectateurs AniList.</p>
        </div>
        <div className="gk-chips tr-tabs" role="group" aria-label="Choisir une liste">
          {(["saison", "prochaine", "manga"] as TrendingTab[]).map((t) => (
            <button key={t} type="button" className="gk-chip" aria-pressed={tab === t} onClick={() => pick(t)}>
              <span>{t === "prochaine" ? `À venir · ${labels[t]}` : labels[t]}</span>
            </button>
          ))}
        </div>
      </header>

      {res === "error" ? (
        <div className="tr-empty" role="alert">
          <p>Les tendances ne sont pas disponibles pour le moment (AniList ne répond pas).</p>
          <button type="button" className="gk-btn gk-btn--sm" onClick={() => retry(tab)}><RefreshCw size={15} aria-hidden="true" /> Réessayer</button>
        </div>
      ) : !res ? (
        <ol className="tr-shelf" aria-busy="true" aria-label="Chargement des tendances">
          {Array.from({ length: 6 }, (_, i) => <li key={i} className="tr-card"><div className="gk-skel tr-skel" /></li>)}
        </ol>
      ) : (
        <>
          <ol className="tr-shelf" key={tab}>
            {items.map((it) => (
              <li key={it.id} className="tr-card" style={{ "--c": it.color ?? "#dfb75b", "--i": it.rank } as React.CSSProperties}>
                <button type="button" aria-expanded={openId === it.id} aria-controls="tr-detail" onClick={() => choose(it)}>
                  <span className="tr-poster">
                    {it.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.cover} alt="" loading="lazy" decoding="async" />
                    )}
                    <span className="tr-rank" aria-hidden="true">{it.rank}</span>
                    {it.score && <span className="tr-score"><Star size={12} fill="currentColor" aria-hidden="true" /> {it.score}%</span>}
                  </span>
                  <span className="tr-name">{it.title}</span>
                  <span className="tr-meta">{[it.format, it.status].filter(Boolean).join(" · ")}</span>
                </button>
              </li>
            ))}
          </ol>

          <div id="tr-detail" ref={detailRef} className="tr-detail-slot" aria-live="polite">
            {open && (
              <article className="tr-detail" key={open.id} style={{ "--c": open.color ?? "#dfb75b", "--banner": open.banner ? `url(${JSON.stringify(open.banner)})` : "none" } as React.CSSProperties}>
                <div className="tr-detail-text">
                  <p className="tr-detail-kicker">{[open.format, open.status, open.episodes ? `${open.episodes} ${open.kind === "MANGA" ? "chapitres" : "épisodes"}` : null].filter(Boolean).join(" · ")}</p>
                  <h3>{open.title}</h3>
                  {open.titleAlt && <p className="tr-alt">{open.titleAlt}</p>}
                  {when(open) && <p className="tr-when">{when(open)}</p>}
                  {open.genres.length > 0 && <ul className="tr-genres">{open.genres.map((g) => <li key={g}>{g}</li>)}</ul>}
                  {open.synopsis
                    ? <p className="tr-synopsis">{open.synopsis}{open.synopsisCredit && <> <a href={open.synopsisCredit.url} target="_blank" rel="noopener noreferrer">({open.synopsisCredit.label})</a></>}</p>
                    : <p className="tr-synopsis is-missing">Pas encore de synopsis en français.</p>}
                  <a className="gk-btn gk-btn--ghost gk-btn--sm" href={open.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" /> Fiche AniList</a>
                </div>
                {open.trailer && (
                  <div className="tr-trailer">
                    {playing === open.id ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${open.trailer}?autoplay=1&rel=0`}
                        title={`Bande-annonce de ${open.title}`}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <button type="button" onClick={() => setPlaying(open.id)} aria-label={`Lire la bande-annonce de ${open.title}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.ytimg.com/vi/${open.trailer}/hqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <span className="tr-play"><Play size={26} fill="currentColor" aria-hidden="true" /> Bande-annonce</span>
                      </button>
                    )}
                  </div>
                )}
              </article>
            )}
          </div>
          <p className="tr-credit">Classement, dates et bandes-annonces : AniList, mis à jour le {STAMP.format(new Date(res.fetchedAt))}. Synopsis : sources françaises citées sur chaque fiche.</p>
        </>
      )}
    </section>
  );
}
