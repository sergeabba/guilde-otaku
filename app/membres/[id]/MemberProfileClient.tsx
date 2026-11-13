"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Cake, ChevronLeft, ChevronRight, Download, ExternalLink, Music, Play, Share2, Trophy, X, Zap } from "lucide-react";
import type { Member } from "../../../data/members";
import GuildeHeader from "../../components/GuildeHeader";
import RomajiLabel from "../../components/RomajiLabel";
import ShareSheet from "../../components/ShareSheet";
import VideoPlayer from "../../components/VideoPlayer";
import { rankAccents, rankLogos, rankRomaji, type Rank } from "../../config/ranks";
import { COUNTRIES, flagUrl } from "../../config/countries";
import { getDaysUntil } from "../../types";
import { onColor } from "../../utils/color";
import { useShare } from "../../hooks/useShare";
import { featuredWorks, objectPosition, workKey, workSubtitle, workTitle, type FavoriteWork, type MemberTrack } from "../../../lib/member-extras";
import "./profile.css";

export interface ProfileNeighbor {
  id: number;
  name: string;
  rank: string;
  image: string;
}

type View = "duo" | "real" | "anime";

const STAT_LABELS: [keyof Member["stats"], string][] = [["force", "Force"], ["vitesse", "Vitesse"], ["technique", "Technique"]];

export default function MemberProfileClient({ member, prev, next, cardUrl, chroniques }: {
  member: Member;
  prev: ProfileNeighbor | null;
  next: ProfileNeighbor | null;
  cardUrl: string;
  /** Favori (clé) vers slug de chronique de la Bibliothèque */
  chroniques: Record<string, string>;
}) {
  const [view, setView] = useState<View>("duo");
  const [animated, setAnimated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [days, setDays] = useState<number | null>(null);
  const [openWork, setOpenWork] = useState<FavoriteWork | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { notify, Toast } = useShare();

  const accent = rankAccents[member.rank as Rank] ?? "#c9a84c";
  const romaji = rankRomaji[member.rank as Rank];
  const country = COUNTRIES.find((c) => c.code === member.country);
  const extras = member.extras ?? {};
  const anime = extras.favoriteAnime ?? [];
  const manga = extras.favoriteManga ?? [];
  const music = extras.music ?? [];
  const stats = member.stats && STAT_LABELS.some(([k]) => (member.stats[k] ?? 0) > 0) ? member.stats : null;
  const special = member.special && member.special.name && !["—", "Inconnu"].includes(member.special.name) ? member.special : null;
  const hasVideo = !!(member.photoVideo || member.animeVideo);

  // Jours avant l'anniversaire : calculés dans le fuseau du visiteur, après montage.
  useEffect(() => {
    const d = getDaysUntil(member.birthday);
    setDays(Number.isFinite(d) ? d : null);
  }, [member.birthday]);

  const downloadCard = async () => {
    setDownloading(true);
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await res.blob());
      a.download = `carte-otaku-${member.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      notify("Carte téléchargée");
    } catch {
      notify("La carte n'a pas pu être générée. Réessaie.");
    } finally {
      setDownloading(false);
    }
  };

  const panels: { key: "real" | "anime"; label: string; src: string; video?: string; pos: string }[] = [
    { key: "real" as const, label: "Réel", src: member.photo, video: member.photoVideo, pos: objectPosition(extras.photoFocus, "50% 20%") },
    { key: "anime" as const, label: "Anime", src: member.animeChar, video: member.animeVideo, pos: objectPosition(extras.animeFocus, "50% 15%") },
  ].filter((p) => p.src);
  const shown = view === "duo" || panels.length < 2 ? panels : panels.filter((p) => p.key === view);

  return (
    <div className="gk-page tone-dark pf-page" style={{ "--gk-accent": accent, "--pf-on": onColor(accent) } as React.CSSProperties}>
      <GuildeHeader activePage="membres" accentColor={accent} tone="dark" />

      <main className="gk-wrap" style={{ paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <nav className="pf-bar" aria-label="Navigation de la fiche">
          <Link href="/#annuaire" className="gk-btn gk-btn--ghost gk-btn--sm">
            <ArrowLeft size={16} aria-hidden="true" /> L&apos;annuaire
          </Link>
          <div className="pf-bar-right">
            <button type="button" className="gk-btn gk-btn--sm" onClick={() => setShareOpen(true)} aria-haspopup="dialog">
              <Share2 size={16} aria-hidden="true" /> Partager
            </button>
          </div>
        </nav>

        {/* ── DOSSIER ─────────────────────────────────────────────────── */}
        <section className="pf-hero" aria-labelledby="pf-name">
          <div className="pf-portraits">
            {panels.length > 1 && (
              <div className="gk-switch pf-switch" role="group" aria-label="Portraits affichés">
                {(["duo", "real", "anime"] as View[]).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                    {v === "duo" ? "Les deux" : v === "real" ? "Réel" : "Anime"}
                  </button>
                ))}
              </div>
            )}
            <div className={`pf-diptych${shown.length === 1 ? " is-single" : ""}`}>
              {shown.map((p, i) => (
                <figure key={p.key} className="pf-panel">
                  {animated && p.video ? (
                    <VideoPlayer src={p.video} fit="cover" objectPosition={p.pos} fullscreenBtn />
                  ) : (
                    <Image
                      src={p.src}
                      alt={p.key === "real" ? `${member.name}, photo` : `${member.name}, version anime`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 899px) 50vw, 30vw"
                      style={{ objectFit: "cover", objectPosition: p.pos }}
                    />
                  )}
                  <figcaption className={p.key === "anime" ? "is-accent" : ""}>{p.label}</figcaption>
                </figure>
              ))}
            </div>
            {hasVideo && (
              <button type="button" className="gk-chip pf-anim" aria-pressed={animated} onClick={() => setAnimated((v) => !v)}>
                <Play size={14} aria-hidden="true" /> <span>{animated ? "Portraits fixes" : "Portraits animés"}</span>
              </button>
            )}
          </div>

          <div className="pf-id gk-reveal">
            <p className="gk-chapter"><b>#{String(member.id).padStart(3, "0")}</b><span>DOSSIER D&apos;AVENTURIER</span></p>
            <h1 id="pf-name" className="gk-display pf-name">{member.name}</h1>
            {extras.displayNameRomaji && <p className="pf-alias" lang="ja-Latn">{extras.displayNameRomaji}</p>}

            <div className="pf-rank">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rankLogos[member.rank as Rank]} alt="" width={120} height={48} />
              <span className="pf-rank-tag">{member.rank}</span>
              {romaji && <RomajiLabel romaji={romaji} className="pf-rank-romaji" />}
            </div>

            {member.badge && (
              <p className="pf-badge"><Trophy size={15} aria-hidden="true" /> {member.badge}</p>
            )}

            <dl className="pf-facts">
              {country && (
                <div>
                  <dt>Pays</dt>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <dd><img src={flagUrl(country.code)} alt="" width={22} height={15} /> {country.label}</dd>
                </div>
              )}
              {member.birthday && (
                <div>
                  <dt>Anniversaire</dt>
                  <dd>
                    <Cake size={15} aria-hidden="true" /> {member.birthday}
                    {days !== null && <small>{days === 0 ? "aujourd'hui !" : days === 1 ? "demain" : `dans ${days} jours`}</small>}
                  </dd>
                </div>
              )}
            </dl>

            {member.bio && <p className="pf-bio">{member.bio}</p>}

            <div className="pf-cta">
              <button type="button" className="gk-btn" onClick={downloadCard} aria-busy={downloading}>
                <Download size={17} aria-hidden="true" /> {downloading ? "Préparation..." : "Télécharger sa carte"}
              </button>
              <button type="button" className="gk-btn gk-btn--ghost" onClick={() => setShareOpen(true)}>
                <Share2 size={17} aria-hidden="true" /> Partager la fiche
              </button>
            </div>
          </div>
        </section>

        {(stats || special) && (
          <section className="pf-section pf-power" aria-labelledby="pf-power-title">
            <h2 id="pf-power-title" className="pf-h2"><RomajiLabel romaji="Tatakai" fr="Fiche de combat" /></h2>
            <div className="pf-power-grid">
              {stats && (
                <dl className="pf-stats">
                  {STAT_LABELS.map(([k, label]) => (
                    <div key={k}>
                      <dt>{label}</dt>
                      <dd>
                        <span className="pf-bar-track" aria-hidden="true"><span style={{ width: `${Math.min(100, member.stats[k] ?? 0)}%` }} /></span>
                        <b>{member.stats[k] ?? 0}</b>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {special && (
                <div className="gk-panel pf-special">
                  <p className="pf-kicker"><Zap size={14} aria-hidden="true" /> Attaque spéciale</p>
                  <p className="pf-special-name">{special.name}</p>
                  {special.effect && special.effect !== "—" && <p className="gk-body">{special.effect}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SON UNIVERS ─────────────────────────────────────────────── */}
        <section className="pf-section" aria-labelledby="pf-universe">
          <div className="pf-section-head">
            <h2 id="pf-universe" className="gk-display gk-h3">Son univers</h2>
            <span className="gk-hand">ce qui fait vibrer {member.name.split(" ")[0]}</span>
          </div>
          <Favorites title="Suki na anime" fr="Anime préférés" works={anime} onOpen={setOpenWork} />
          <Favorites title="Suki na manga" fr="Mangas préférés" works={manga} onOpen={setOpenWork} />
          {music.length > 0 && <Tracks tracks={music} />}
        </section>

        {(prev || next) && (
          <nav className="pf-pager" aria-label="Autres membres">
            {prev ? <NeighborLink n={prev} dir="prev" /> : <span />}
            {next ? <NeighborLink n={next} dir="next" /> : <span />}
          </nav>
        )}
      </main>

      {openWork && <WorkSheet work={openWork} chronique={chroniques[workKey(openWork)]} onClose={() => setOpenWork(null)} />}
      <ShareSheet member={member} open={shareOpen} onClose={() => setShareOpen(false)} />
      <Toast />
    </div>
  );
}

function Favorites({ title, fr, works, onOpen }: { title: string; fr: string; works: FavoriteWork[]; onOpen: (w: FavoriteWork) => void }) {
  const [all, setAll] = useState(false);
  const top = featuredWorks(works);
  const rest = works.filter((w) => !top.includes(w));
  return (
    <div className="pf-fav">
      <h3 className="pf-h3"><RomajiLabel romaji={title} fr={fr} inline /></h3>
      {works.length === 0 ? (
        <p className="pf-empty">Ses coups de cœur arrivent bientôt.</p>
      ) : (
        <>
          <ol className="pf-fav-top gk-stagger">
            {top.map((w, i) => (
              <li key={workKey(w)} style={{ "--i": i } as React.CSSProperties}>
                <WorkCard work={w} onOpen={onOpen} big />
              </li>
            ))}
          </ol>
          {rest.length > 0 && (
            <>
              {all && (
                <ol className="pf-fav-rest">
                  {rest.map((w) => <li key={workKey(w)}><WorkCard work={w} onOpen={onOpen} /></li>)}
                </ol>
              )}
              <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" style={{ marginTop: 14 }} onClick={() => setAll((v) => !v)} aria-expanded={all}>
                {all ? "Voir seulement les coups de cœur" : `Voir les ${works.length} titres`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function WorkCard({ work, onOpen, big = false }: { work: FavoriteWork; onOpen: (w: FavoriteWork) => void; big?: boolean }) {
  const title = workTitle(work);
  const sub = workSubtitle(work);
  return (
    <button type="button" className={`pf-work${big ? " is-big" : ""}`} onClick={() => onOpen(work)} aria-label={`${title}${sub ? `, ${sub}` : ""}. Ouvrir la mini-fiche.`}>
      <span className="pf-work-cover">
        {work.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.coverUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="pf-work-nocover" aria-hidden="true">{work.kind === "ANIME" ? "Anime" : "Manga"}</span>
        )}
      </span>
      <span className="pf-work-body">
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
        {big && work.personalNote && <em>« {work.personalNote} »</em>}
      </span>
    </button>
  );
}

function WorkSheet({ work, chronique, onClose }: { work: FavoriteWork; chronique?: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [onClose]);
  const sub = workSubtitle(work);
  return createPortal(
    <div className="sh-back tone-dark" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="sh-sheet pf-worksheet" role="dialog" aria-modal="true" aria-labelledby="pf-ws-title">
        <div className="sh-head">
          <span className="gk-tag">{work.kind === "ANIME" ? "Anime" : "Manga"}</span>
          <button type="button" className="gk-icon-btn" onClick={onClose} aria-label="Fermer la mini-fiche"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="pf-ws-body">
          {work.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.coverUrl} alt={`Couverture de ${workTitle(work)}`} />
          )}
          <div>
            <h2 id="pf-ws-title">{workTitle(work)}</h2>
            {sub && <p className="pf-ws-sub">{sub}</p>}
            {work.personalNote && <p className="pf-ws-note">« {work.personalNote} »</p>}
          </div>
        </div>
        <div className="sh-actions">
          {chronique && <Link className="gk-btn" href={`/bibliotheque?chronique=${chronique}`}>Lire la chronique</Link>}
          {work.sourceUrl && (
            <a className="gk-btn gk-btn--ghost" href={work.sourceUrl} target="_blank" rel="noopener noreferrer">
              Fiche complète <ExternalLink size={15} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Tracks({ tracks }: { tracks: MemberTrack[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <div className="pf-fav">
      <h3 className="pf-h3"><RomajiLabel romaji="Ongaku" fr="Ses morceaux" inline /></h3>
      <ul className="pf-tracks">
        {tracks.map((t) => (
          <li key={t.id}>
            {playing === t.id ? (
              <div className="pf-track-player">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${t.id}?autoplay=1&rel=0`}
                  title={t.title ? `Lecture : ${t.title}` : "Lecture du morceau"}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={() => setPlaying(null)}>Arrêter</button>
              </div>
            ) : (
              <button type="button" className="pf-track" onClick={() => setPlaying(t.id)}>
                <Music size={16} aria-hidden="true" />
                <span>{t.title || "Morceau sans titre"}</span>
                <span className="pf-track-play">Écouter</span>
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="pf-empty" style={{ marginTop: 8 }}>La lecture ne démarre que lorsque tu appuies sur « Écouter ».</p>
    </div>
  );
}

function NeighborLink({ n, dir }: { n: ProfileNeighbor; dir: "prev" | "next" }) {
  return (
    <Link href={`/membres/${n.id}`} className={`pf-neighbor is-${dir}`} rel={dir}>
      {dir === "prev" && <ChevronLeft size={20} aria-hidden="true" />}
      {n.image && (
        <span className="pf-neighbor-img">
          <Image src={n.image} alt="" fill sizes="56px" style={{ objectFit: "cover", objectPosition: "50% 15%" }} />
        </span>
      )}
      <span>
        <small>{dir === "prev" ? "Membre précédent" : "Membre suivant"}</small>
        <strong>{n.name}</strong>
      </span>
      {dir === "next" && <ChevronRight size={20} aria-hidden="true" />}
    </Link>
  );
}
