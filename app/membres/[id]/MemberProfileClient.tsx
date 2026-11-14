"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { viewTransition, waitFor } from "../../../lib/view-transition";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Cake, ChevronLeft, ChevronRight, Download, ExternalLink, Play, Share2, Trophy, X, Zap } from "lucide-react";
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
import { featuredWorks, memberAwards, objectPosition, workKey, workSubtitle, workTitle, type FavoriteWork } from "../../../lib/member-extras";
import MemberAwards from "../../components/MemberAwards";
import MemberMusic from "../../components/MemberMusic";
import TrailerEmbed from "../../components/works/TrailerEmbed";
import { trailerLangLabel } from "../../../lib/works/favorite";
import { FORMAT_LABEL } from "../../../lib/works/types";
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
  // Ouverture d'une œuvre : la couverture touchée devient celle de la mini-fiche.
  const openWorkFrom = (w: FavoriteWork, el?: HTMLElement | null) => viewTransition({
    kind: "work", from: [[el?.querySelector(".pf-work-cover"), "work-cover"]],
    update: () => flushSync(() => setOpenWork(w)),
  });
  const closeWork = () => {
    const key = openWork ? workKey(openWork) : "";
    viewTransition({
      kind: "work", update: () => flushSync(() => setOpenWork(null)),
      to: () => [[document.querySelector(`[data-work-key="${CSS.escape(key)}"] .pf-work-cover`), "work-cover"]],
    });
  };
  // Réel / anime : les panneaux se redimensionnent au lieu de sauter.
  const changeView = (v: View) => viewTransition({ kind: "swap", update: () => flushSync(() => setView(v)) });
  const [downloading, setDownloading] = useState(false);
  const { notify, Toast } = useShare();

  const accent = rankAccents[member.rank as Rank] ?? "#c9a84c";
  const romaji = rankRomaji[member.rank as Rank];
  const country = COUNTRIES.find((c) => c.code === member.country);
  const extras = member.extras ?? {};
  const anime = extras.favoriteAnime ?? [];
  const manga = extras.favoriteManga ?? [];
  const music = extras.music ?? [];
  const awards = memberAwards(member);
  const stats = member.stats && STAT_LABELS.some(([k]) => (member.stats[k] ?? 0) > 0) ? member.stats : null;
  const special = member.special && member.special.name && !["—", "Inconnu"].includes(member.special.name) ? member.special : null;
  const hasVideo = !!(member.photoVideo || member.animeVideo);

  // Hauteur de l'en-tête collant, pour placer le sommaire de la fiche juste dessous.
  useEffect(() => {
    const head = document.querySelector<HTMLElement>(".gk-header");
    if (!head) return;
    const set = () => document.documentElement.style.setProperty("--pf-head", `${head.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(head);
    return () => ro.disconnect();
  }, []);

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

  // Sommaire : seulement les rubriques présentes, numérotées dans l'ordre.
  const sections = [
    awards.length > 0 && { id: "pf-palmares", label: "Palmarès" },
    (stats || special) && { id: "pf-combat", label: "Combat" },
    { id: "pf-univers", label: "Univers" },
    music.length > 0 && { id: "pf-musique", label: "Musique" },
  ].filter(Boolean).map((t, i) => ({ ...(t as { id: string; label: string }), n: String(i + 1).padStart(2, "0") }));
  const num = (id: string) => sections.find((t) => t.id === id)?.n ?? "";

  return (
    <div className="gk-page tone-dark pf-page" data-member-page={member.id} style={{ "--gk-accent": accent, "--pf-on": onColor(accent) } as React.CSSProperties}>
      <GuildeHeader activePage="membres" accentColor={accent} tone="dark" />

      {/* Fond de la fiche : portrait anime flouté, lueur à la couleur du rang, trame. */}
      <div className="pf-backdrop" aria-hidden="true">
        {(member.animeChar || member.photo) && <span className="pf-backdrop-img" style={{ backgroundImage: `url(${JSON.stringify(member.animeChar || member.photo)})` }} />}
        <span className="pf-backdrop-num">{String(member.id).padStart(3, "0")}</span>
      </div>

      <main className="gk-wrap pf-main" style={{ paddingBottom: "clamp(56px, 9vw, 110px)" }}>
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
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => changeView(v)}>
                    {v === "duo" ? "Les deux" : v === "real" ? "Réel" : "Anime"}
                  </button>
                ))}
              </div>
            )}
            <div className={`pf-diptych${shown.length === 1 ? " is-single" : ""}`} style={{ viewTransitionName: "member-dossier" }}>
              {shown.map((p, i) => (
                <figure key={p.key} className="pf-panel" style={{ viewTransitionName: `pf-panel-${p.key}` }}>
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
            <h1 id="pf-name" className="gk-display pf-name" style={{ viewTransitionName: "member-name" }}>{member.name}</h1>
            {extras.displayNameRomaji && <p className="pf-alias" lang="ja-Latn">{extras.displayNameRomaji}</p>}

            <div className="pf-rank">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rankLogos[member.rank as Rank]} alt="" width={120} height={48} />
              <span className="pf-rank-tag">{member.rank}</span>
              {romaji && <RomajiLabel romaji={romaji} className="pf-rank-romaji" />}
            </div>

            {awards.length > 0 && (
              <div className="pf-badges">
                <a className="pf-badge" href="#pf-palmares"><Trophy size={15} aria-hidden="true" /> {awards[0].title}</a>
                {awards.length > 1 && <a className="pf-badge-more" href="#pf-palmares">+{awards.length - 1} distinction{awards.length > 2 ? "s" : ""}</a>}
              </div>
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
                <Download size={17} aria-hidden="true" /> {downloading ? "Préparation…" : "Télécharger sa carte"}
              </button>
              <button type="button" className="gk-btn gk-btn--ghost" onClick={() => setShareOpen(true)}>
                <Share2 size={17} aria-hidden="true" /> Partager la fiche
              </button>
            </div>
          </div>
        </section>

        <nav className="pf-tabs" aria-label="Sommaire de la fiche">
          {sections.map((t) => <a key={t.id} href={`#${t.id}`}><b>{t.n}</b>{t.label}</a>)}
        </nav>

        {awards.length > 0 && (
          <section id="pf-palmares" className="pf-section" aria-labelledby="pf-palmares-title" data-gk-motion="">
            <SectionHead n={num("pf-palmares")} id="pf-palmares-title" romaji="Kunshō" fr="Palmarès" />
            <MemberAwards awards={awards} />
          </section>
        )}

        {(stats || special) && (
          <section id="pf-combat" className="pf-section pf-power" aria-labelledby="pf-power-title" data-gk-motion="">
            <SectionHead n={num("pf-combat")} id="pf-power-title" romaji="Tatakai" fr="Fiche de combat" />
            <div className="pf-power-grid">
              {stats && (
                <dl className="pf-stats">
                  {STAT_LABELS.map(([k, label]) => (
                    <div key={k}>
                      <dt>{label}</dt>
                      <dd>
                        <span className="pf-seg" aria-hidden="true">
                          {Array.from({ length: 20 }, (_, i) => <i key={i} className={i < Math.round(Math.min(100, member.stats[k] ?? 0) / 5) ? "is-on" : ""} />)}
                        </span>
                        <b>{member.stats[k] ?? 0}</b>
                        <span className="pf-grade">{grade(member.stats[k] ?? 0)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {special && (
                <div className="gk-panel pf-special">
                  <p className="pf-kicker"><Zap size={14} aria-hidden="true" /> Attaque spéciale</p>
                  <p className="pf-special-name">{special.name}</p>
                  <span className="pf-special-bolt" aria-hidden="true"><Zap size={88} /></span>
                  {special.effect && special.effect !== "—" && <p className="gk-body">{special.effect}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SON UNIVERS ─────────────────────────────────────────────── */}
        <section id="pf-univers" className="pf-section" aria-labelledby="pf-universe" data-gk-motion="">
          <SectionHead n={num("pf-univers")} id="pf-universe" romaji="Sekai" fr="Son univers" hand={`ce qui fait vibrer ${member.name.split(" ")[0]}`} />
          <Favorites title="Suki na anime" fr="Anime préférés" works={anime} onOpen={openWorkFrom} />
          <Favorites title="Suki na manga" fr="Mangas préférés" works={manga} onOpen={openWorkFrom} />
        </section>

        {music.length > 0 && (
          <section id="pf-musique" className="pf-section pf-music-sec" aria-labelledby="pf-music-title" data-gk-motion="">
            <SectionHead n={num("pf-musique")} id="pf-music-title" romaji="Ongaku" fr="Sa playlist" />
            <MemberMusic tracks={music} owner={member.name.split(" ")[0]} />
          </section>
        )}

        {(prev || next) && (
          <nav className="pf-pager" aria-label="Autres membres">
            {prev ? <NeighborLink n={prev} dir="prev" /> : <span />}
            {next ? <NeighborLink n={next} dir="next" /> : <span />}
          </nav>
        )}
      </main>

      {openWork && <WorkSheet key={workKey(openWork)} work={openWork} chronique={chroniques[workKey(openWork)]} onClose={closeWork} />}
      <ShareSheet member={member} open={shareOpen} onClose={() => setShareOpen(false)} />
      <Toast />
    </div>
  );
}

/** Note dérivée de la valeur affichée (aucune donnée ajoutée). */
const grade = (v: number) => (v >= 90 ? "S" : v >= 75 ? "A" : v >= 60 ? "B" : v >= 40 ? "C" : "D");

function SectionHead({ n, id, romaji, fr, hand }: { n: string; id: string; romaji: string; fr: string; hand?: string }) {
  return (
    <header className="pf-sec-head">
      <span className="pf-sec-n" aria-hidden="true">{n}</span>
      <h2 id={id} className="pf-sec-title"><RomajiLabel romaji={romaji} fr={fr} /></h2>
      {hand && <span className="gk-hand pf-sec-hand">{hand}</span>}
    </header>
  );
}

type OpenWork = (w: FavoriteWork, el?: HTMLElement | null) => void;

function Favorites({ title, fr, works, onOpen }: { title: string; fr: string; works: FavoriteWork[]; onOpen: OpenWork }) {
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

/** Jaquette officielle telle quelle ; repli neutre si l'URL est absente ou ne charge pas. */
function WorkCover({ work }: { work: FavoriteWork }) {
  const [failed, setFailed] = useState(false);
  // L'image rendue côté serveur peut échouer avant l'hydratation : l'événement
  // `error` est alors perdu. On vérifie donc son état quand React la rattache.
  const checkBroken = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  };
  if (!work.coverUrl || failed) {
    return (
      <span className="pf-work-nocover" aria-hidden="true">
        <b>{workTitle(work).slice(0, 1).toUpperCase()}</b>
        <small>{work.kind === "ANIME" ? "Anime" : "Manga"}</small>
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={checkBroken} src={work.coverUrl} alt="" width={112} height={168} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function WorkCard({ work, onOpen, big = false }: { work: FavoriteWork; onOpen: OpenWork; big?: boolean }) {
  const title = workTitle(work);
  const sub = workSubtitle(work);
  return (
    <button type="button" className={`pf-work${big ? " is-big" : ""}`} data-work-key={workKey(work)} onClick={(e) => onOpen(work, e.currentTarget)} aria-label={`${title}${sub ? `, ${sub}` : ""}. Ouvrir la mini-fiche.`}>
      <span className="pf-work-cover">
        <WorkCover work={work} />
      </span>
      <span className="pf-work-body">
        {(work.format || work.year) && <span className="pf-work-meta">{[work.format && FORMAT_LABEL[work.format], work.year].filter(Boolean).join(" · ")}</span>}
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
        {big && (work.personalNote ? <em>« {work.personalNote} »</em> : work.synopsis ? <span className="pf-work-syn">{work.synopsis}</span> : null)}
      </span>
    </button>
  );
}

function WorkSheet({ work, chronique, onClose }: { work: FavoriteWork; chronique?: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [coverFailed, setCoverFailed] = useState(false);
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
          {work.coverUrl && !coverFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.coverUrl} alt={`Couverture de ${workTitle(work)}`} width={220} height={330} style={{ viewTransitionName: "work-cover" }} onError={() => setCoverFailed(true)} />
          ) : <span className="pf-ws-nocover" aria-hidden="true">{workTitle(work).slice(0, 1)}</span>}
          <div className="pf-ws-info">
            <h2 id="pf-ws-title">{workTitle(work)}</h2>
            {sub && <p className="pf-ws-sub">{sub}</p>}
            <p className="pf-ws-meta">
              {[work.format ? FORMAT_LABEL[work.format] : work.kind === "ANIME" ? "Anime" : "Manga", work.year, ...(work.genres ?? []).slice(0, 3)].filter(Boolean).map((m) => <span key={String(m)}>{m}</span>)}
            </p>
            {work.personalNote && <p className="pf-ws-note">« {work.personalNote} »</p>}
          </div>
        </div>
        {work.synopsis && (
          <div className="pf-ws-block">
            <h3>Synopsis</h3>
            <p className="pf-ws-synopsis">{work.synopsis}</p>
            {work.synopsisSource === "source" && (work.source === "tmdb" || work.source === "mangadex") && <small className="pf-ws-credit">Synopsis : {work.source === "tmdb" ? "TMDB" : "MangaDex"}</small>}
          </div>
        )}
        {work.trailer && (
          <div className="pf-ws-block">
            <h3>Bande-annonce</h3>
            <TrailerEmbed youtubeId={work.trailer.youtubeId} title={workTitle(work)} langLabel={trailerLangLabel(work.trailer.lang)} />
          </div>
        )}
        <div className="sh-actions">
          {chronique && <Link className="gk-btn" href={`/bibliotheque?chronique=${chronique}`}>Lire la chronique</Link>}
          {work.sourceUrl && (
            <a className="gk-btn gk-btn--ghost" href={work.sourceUrl} target="_blank" rel="noopener noreferrer">
              {work.source === "tmdb" ? "Voir sur TMDB" : work.source === "mangadex" ? "Voir sur MangaDex" : "Fiche complète"} <ExternalLink size={15} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


function NeighborLink({ n, dir }: { n: ProfileNeighbor; dir: "prev" | "next" }) {
  const router = useRouter();
  const href = `/membres/${n.id}`;
  // Fiche voisine préchargée en entier dès l'arrivée : le passage est immédiat.
  useEffect(() => { router.prefetch(href); }, [router, href]);
  return (
    <Link href={href} prefetch className={`pf-neighbor is-${dir}`} rel={dir} onClick={(e) => {
      // Passage d'une fiche à l'autre : le dossier glisse dans la direction choisie.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      viewTransition({ kind: dir === "next" ? "page-next" : "page-prev", update: async () => { router.push(href); await waitFor(`[data-member-page="${n.id}"]`, 450); } });
    }}>
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
