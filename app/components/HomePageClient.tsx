"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal, flushSync } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Search, Sword, User, X } from "lucide-react";
import { Rank, Member, RANK_FILTER_ORDER } from "../../data/members";
import MemberCard from "./MemberCard";
import MemberQuickView from "./MemberQuickView";
import GuildeHeader from "./GuildeHeader";
import ChapterStory from "./ChapterStory";
import WordReveal from "./WordReveal";
import { rankAccents, rankLogos, darkRanks, rankRomaji } from "../config/ranks";
import { COUNTRIES, flagUrl } from "../config/countries";
import { NAV, chapterNo } from "../config/nav";
import { useTheme } from "../context/ThemeContext";
import { getDaysUntil, type ViewMode } from "../types";
import { normalize } from "../utils/text";
import { onColor } from "../utils/color";
import "../styles/home.css";
import { viewTransition } from "../../lib/view-transition";

export interface FeaturedFilm {
  title: string;
  synopsis?: string | null;
  image?: string | null;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

export default function HomePageClient({ initialMembers, featuredFilm }: {
  initialMembers: Member[];
  featuredFilm?: FeaturedFilm | null;
}) {
  const [activeRank, setActiveRank] = useState<Rank | "Tous">("Tous");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  // Ouverture : le portrait touché se transforme en fiche rapide (transition native,
  // immédiate sans prise en charge ou avec « réduire les animations »).
  const openMember = useCallback((m: Member, el?: HTMLElement | null) => {
    viewTransition({
      kind: "member",
      from: [[el?.querySelector(".mc-media") ?? el, "member-portrait"]],
      update: () => flushSync(() => setSelectedMember(m)),
      // Un seul élément partagé : le portrait de la carte devient celui de la fiche.
      to: () => [[document.querySelector(".qv-diptych .pf-panel"), "member-portrait"]],
    });
  }, []);
  const closeMember = useCallback(() => {
    const id = selectedMember?.id;
    viewTransition({
      kind: "member-close",
      from: [[document.querySelector(".qv-diptych .pf-panel"), "member-portrait"]],
      update: () => flushSync(() => setSelectedMember(null)),
      // Retour vers la carte, seulement si elle est à l'écran.
      to: () => {
        const card = id ? document.querySelector<HTMLElement>(`[data-member-id="${id}"] .mc-media`) : null;
        const r = card?.getBoundingClientRect();
        return r && r.bottom > 0 && r.top < window.innerHeight ? [[card, "member-portrait"]] : [];
      },
    });
  }, [selectedMember]);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [mounted, setMounted] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const directoryRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const { isDark: globalDark } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  // Lien profond historique : /?membre=12 ouvre la fiche
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const membreId = params.get("membre");
    if (membreId) {
      const found = initialMembers.find((m) => m.id === Number(membreId));
      if (found) setSelectedMember(found);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [initialMembers]);

  // La bascule Réel / Anime flotte une fois la barre d'outils dépassée,
  // tant que l'annuaire reste à l'écran.
  useEffect(() => {
    const dir = directoryRef.current;
    const tools = toolsRef.current;
    if (!dir || !tools) return;
    let dirIn = false;
    let toolsPassed = false;
    const update = () => setShowFloat(dirIn && toolsPassed);
    const ioDir = new IntersectionObserver(([e]) => { dirIn = e.isIntersecting; update(); });
    const ioTools = new IntersectionObserver(([e]) => {
      toolsPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    });
    ioDir.observe(dir);
    ioTools.observe(tools);
    return () => { ioDir.disconnect(); ioTools.disconnect(); };
  }, []);

  const rankIsDark = darkRanks.includes(activeRank as Rank);
  const isDark = activeRank !== "Tous" ? rankIsDark : globalDark;
  const accent = rankAccents[activeRank];

  const rankCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of initialMembers) c[m.rank] = (c[m.rank] || 0) + 1;
    return c;
  }, [initialMembers]);

  const countryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of initialMembers) if (m.country) c[m.country] = (c[m.country] || 0) + 1;
    return c;
  }, [initialMembers]);

  const availableCountries = useMemo(
    () => COUNTRIES.filter((c) => countryCounts[c.code]).sort((a, b) => countryCounts[b.code] - countryCounts[a.code]),
    [countryCounts]
  );
  const activeRankCount = RANK_FILTER_ORDER.filter((r) => rankCounts[r]).length;

  const filteredMembers = useMemo(() => {
    const q = normalize(searchTerm.trim());
    return initialMembers.filter((m) =>
      (activeRank === "Tous" || m.rank === activeRank) &&
      (!activeCountry || m.country === activeCountry) &&
      (!q || normalize(m.name).includes(q))
    );
  }, [activeRank, searchTerm, activeCountry, initialMembers]);

  // Couverture : les trois premiers du registre, dans l'ordre de la hiérarchie
  const coverMembers = useMemo(() => {
    const ordered = [...initialMembers].sort(
      (a, b) => RANK_FILTER_ORDER.indexOf(a.rank) - RANK_FILTER_ORDER.indexOf(b.rank)
    );
    return ordered.filter((m) => m.animeChar || m.photo).slice(0, 3);
  }, [initialMembers]);

  // À la une : anniversaire du jour, sinon le prochain. Calculé côté client
  // (fuseau du visiteur), donc seulement après montage.
  const birthdayNews = useMemo(() => {
    if (!mounted) return null;
    const dated = initialMembers
      .map((m) => ({ m, d: getDaysUntil(m.birthday) }))
      .filter((x) => Number.isFinite(x.d))
      .sort((a, b) => a.d - b.d);
    if (!dated.length) return null;
    const soonest = dated.filter((x) => x.d === dated[0].d);
    return { days: dated[0].d, members: soonest.map((x) => x.m) };
  }, [initialMembers, mounted]);

  const hasFilters = activeRank !== "Tous" || !!activeCountry || !!searchTerm;
  const resetFilters = () => { setActiveRank("Tous"); setActiveCountry(null); setSearchTerm(""); };
  const scrollToDirectory = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    directoryRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const visibleRanks = activeRank === "Tous" ? RANK_FILTER_ORDER : [activeRank];
  let cardIndex = 0;

  return (
    <>
      <div
        className={`gk-page tone-${isDark ? "dark" : "light"}`}
        style={{ "--gk-accent": accent, transition: "background 400ms, color 400ms" } as React.CSSProperties}
      >
        <GuildeHeader activePage="membres" accentColor={accent} tone={isDark ? "dark" : "light"} />

        <main>
          {/* ── COUVERTURE ─────────────────────────────────────────────── */}
          <section className="gk-wrap hm-cover" aria-labelledby="hm-title">
            <div className="gk-speed hm-cover-speed" aria-hidden="true" />

            <div className="hm-cover-copy gk-reveal">
              <p className="gk-chapter"><b>01</b><span>LE REGISTRE DES MEMBRES</span></p>
              <h1 id="hm-title" className="gk-display hm-title">
                <span>GUILDE</span>
                <span className="hm-title-2 gk-inked">OTAKU</span>
              </h1>
              <p className="hm-lede">
                Depuis 2020, une bande d&apos;amis qui débat d&apos;animes, élit ses films et se décerne des titres.
                Voici qui la compose.
              </p>
              <dl className="hm-facts">
                <div><dt>Membres</dt><dd>{initialMembers.length}</dd></div>
                <div><dt>Grades</dt><dd>{activeRankCount}</dd></div>
                {availableCountries.length > 0 && <div><dt>Pays</dt><dd>{availableCountries.length}</dd></div>}
              </dl>
              <div className="hm-cta">
                <button type="button" className="gk-btn" onClick={scrollToDirectory}>
                  Ouvrir l&apos;annuaire <ArrowDown size={17} aria-hidden="true" />
                </button>
                <Link href="/bibliotheque" className="gk-btn gk-btn--ghost">Lire la Chronique du Bash</Link>
              </div>
            </div>

            {coverMembers.length === 3 && (
              <div className="hm-board">
                <span className="gk-vertical hm-board-jp" aria-hidden="true">Densetsu no nakama</span>
                {coverMembers.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    className="hm-case"
                    onClick={(e) => openMember(m, e.currentTarget)}
                    aria-label={`Ouvrir la fiche de ${m.name}, ${m.rank}`}
                    style={{ padding: 0, cursor: "pointer" }}
                  >
                    <Image
                      src={m.animeChar || m.photo}
                      alt=""
                      fill
                      priority={i === 0}
                      sizes={i === 0 ? "(max-width: 979px) 56vw, 380px" : "(max-width: 979px) 44vw, 300px"}
                    />
                    <span className="hm-case-cap">
                      {m.name}
                      <small>{m.rank}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="gk-motion-ticker" aria-hidden="true">
            <div className="gk-motion-ticker-track">
              <span>LA GUILDE ✦ LA LÉGENDE ✦ LES CHAPITRES ✦ LA GUILDE ✦ LA LÉGENDE ✦ LES CHAPITRES ✦</span>
              <span>LA GUILDE ✦ LA LÉGENDE ✦ LES CHAPITRES ✦ LA GUILDE ✦ LA LÉGENDE ✦ LES CHAPITRES ✦</span>
            </div>
          </div>

          <ChapterStory />

          <hr className="gk-rule" />

          {/* ── SOMMAIRE + À LA UNE ────────────────────────────────────── */}
          <section className="gk-wrap hm-section" aria-labelledby="hm-toc-title" data-gk-motion="reveal">
            <div className="hm-split">
              <div>
                <div className="hm-section-head">
                  <h2 id="hm-toc-title" className="gk-display gk-h3">
                    <WordReveal>Au sommaire</WordReveal> <span className="gk-jp" aria-hidden="true">Mokuji</span>
                  </h2>
                </div>
                <ol className="hm-toc">
                  {NAV.slice(1).map((n, i) => (
                    <li key={n.id}>
                      <Link href={n.href}>
                        <b aria-hidden="true">{chapterNo(i + 1)}</b>
                        <span>
                          <strong>{n.label}</strong>
                          <em>{n.blurb}</em>
                        </span>
                        <i aria-hidden="true">{n.jp}</i>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="hm-section-head">
                  <h2 className="gk-display gk-h3"><WordReveal>À la une</WordReveal></h2>
                  <span className="gk-hand">cette semaine à la Guilde</span>
                </div>
                <div className="hm-une">
                  {featuredFilm && (
                    <Link href="/film-semaine" className="gk-panel gk-press hm-une-card is-lead">
                      {featuredFilm.image && (
                        <div className="hm-une-media">
                          <Image src={featuredFilm.image} alt="" fill sizes="(max-width: 979px) 100vw, 560px" />
                        </div>
                      )}
                      <div className="hm-une-body">
                        <span className="hm-une-kicker">Film de la semaine</span>
                        <h3>{featuredFilm.title}</h3>
                        {featuredFilm.synopsis && <p>{featuredFilm.synopsis}</p>}
                      </div>
                    </Link>
                  )}

                  {birthdayNews && (
                    <Link href="/birthdays" className="gk-panel gk-press hm-une-card">
                      <div className="hm-une-media">
                        {(birthdayNews.members[0].animeChar || birthdayNews.members[0].photo) && (
                          <Image
                            src={birthdayNews.members[0].animeChar || birthdayNews.members[0].photo}
                            alt=""
                            fill
                            sizes="96px"
                            style={{ objectPosition: "top" }}
                          />
                        )}
                      </div>
                      <div className="hm-une-body">
                        <span className="hm-une-kicker">
                          {birthdayNews.days === 0 ? "Anniversaire du jour" : "Prochain anniversaire"}
                        </span>
                        <h3>{birthdayNews.members.map((m) => m.name).join(" & ")}</h3>
                        <p>
                          {birthdayNews.days === 0
                            ? "C'est aujourd'hui. Passe lui souhaiter."
                            : birthdayNews.days === 1
                              ? `C'est demain, le ${birthdayNews.members[0].birthday}.`
                              : `Dans ${birthdayNews.days} jours, le ${birthdayNews.members[0].birthday}.`}
                        </p>
                      </div>
                    </Link>
                  )}

                  <Link href="/bibliotheque" className="gk-panel gk-press hm-une-card">
                    <div className="hm-une-media">
                      <Image src="/covers/bash/drops-of-god.jpg" alt="" fill sizes="96px" />
                    </div>
                    <div className="hm-une-body">
                      <span className="hm-une-kicker">Bibliothèque</span>
                      <h3>La Chronique du Bash</h3>
                      <p>Les verdicts définitifs de la Guilde sur les animes et mangas.</p>
                    </div>
                  </Link>

                  <Link href="/atelier" className="gk-panel gk-press hm-une-card">
                    <div className="hm-une-media">
                      <Image src="/atelier/teamotaku.png" alt="" fill sizes="96px" />
                    </div>
                    <div className="hm-une-body">
                      <span className="hm-une-kicker">Atelier</span>
                      <h3>L&apos;Atelier de la Guilde</h3>
                      <p>La galerie des créations de la Guilde, générées par intelligence artificielle.</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <hr className="gk-rule" />

          {/* ── ANNUAIRE ───────────────────────────────────────────────── */}
          <section id="annuaire" data-gk-motion="reveal" className="gk-wrap hm-section" ref={directoryRef} aria-labelledby="hm-dir-title" style={{ scrollMarginTop: 110 }}>
            <div className="hm-section-head">
              <div>
                <span className="gk-hand">du Fondateur aux Revenants</span>
                <h2 id="hm-dir-title" className="gk-display gk-h2" style={{ marginTop: 4 }}>
                  <WordReveal>L&apos;annuaire</WordReveal>
                </h2>
              </div>
              <span className="gk-stamp" aria-hidden="true">Kōshiki meibo</span>
            </div>

            {/* Hiérarchie : chaque grade est un échelon cliquable */}
            <div className="hm-ranks" role="group" aria-label="Filtrer par grade">
              <button
                type="button"
                className="hm-rank"
                aria-pressed={activeRank === "Tous"}
                onClick={() => viewTransition({ kind: "list", update: () => flushSync(() => setActiveRank("Tous")) })}
                style={{ "--rk": rankAccents["Tous"] } as React.CSSProperties}
              >
                <span className="hm-rank-all" aria-hidden="true">Zen</span>
                <strong>Tous</strong>
                <small aria-hidden="true">{rankRomaji["Tous"]}</small>
                <span className="hm-rank-n">{initialMembers.length} membres</span>
              </button>
              {RANK_FILTER_ORDER.map((rank, i) => {
                const n = rankCounts[rank] || 0;
                const on = onColor(rankAccents[rank]);
                return (
                  <button
                    key={rank}
                    type="button"
                    className={`hm-rank${on === "#fff" ? " is-darktext-off" : ""}`}
                    aria-pressed={activeRank === rank}
                    onClick={() => viewTransition({ kind: "list", update: () => flushSync(() => setActiveRank(activeRank === rank ? "Tous" : rank)) })}
                    style={{ "--rk": rankAccents[rank] } as React.CSSProperties}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rankLogos[rank]} alt="" loading="lazy" />
                    <strong>{rank}</strong>
                    <small aria-hidden="true">{ROMAN[i]} {rankRomaji[rank]}</small>
                    <span className="hm-rank-n">{n} {n > 1 ? "membres" : "membre"}</span>
                  </button>
                );
              })}
            </div>

            <div className="hm-tools" ref={toolsRef} style={{ marginTop: 22 }}>
              <div className="gk-field">
                <Search size={19} aria-hidden="true" />
                <input
                  type="search"
                  className="gk-input"
                  placeholder="Chercher un membre"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Chercher un membre par son nom"
                  enterKeyHint="search"
                />
                {searchTerm && (
                  <button type="button" className="gk-clear no-min" onClick={() => setSearchTerm("")} aria-label="Effacer la recherche">
                    <X size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="gk-switch" role="group" aria-label="Type de portrait">
                <button type="button" aria-pressed={viewMode === "real"} onClick={() => setViewMode("real")}>
                  <User size={16} aria-hidden="true" /> Réel
                </button>
                <button type="button" aria-pressed={viewMode === "anime"} onClick={() => setViewMode("anime")}>
                  <Sword size={16} aria-hidden="true" /> Anime
                </button>
              </div>
            </div>

            {availableCountries.length > 0 && (
              <div className="gk-chips gk-chips--wrap" role="group" aria-label="Filtrer par pays">
                <button type="button" className="gk-chip" aria-pressed={!activeCountry} onClick={() => setActiveCountry(null)}>
                  <span>Tous les pays</span>
                </button>
                {availableCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className="gk-chip"
                    aria-pressed={activeCountry === c.code}
                    onClick={() => setActiveCountry(activeCountry === c.code ? null : c.code)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="hm-flag" src={flagUrl(c.code)} alt="" />
                    <span>{c.label} <small>{countryCounts[c.code]}</small></span>
                  </button>
                ))}
              </div>
            )}

            <p className="hm-count" role="status" aria-live="polite">
              <b>{filteredMembers.length}</b> {filteredMembers.length > 1 ? "membres affichés" : "membre affiché"}
              {hasFilters && (
                <>
                  {" "}
                  <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm no-min" onClick={resetFilters} style={{ marginLeft: 10 }}>
                    Tout réafficher
                  </button>
                </>
              )}
            </p>

            {filteredMembers.length === 0 ? (
              <div className="gk-empty">
                <div className="gk-empty-glyph" aria-hidden="true">Fuzai</div>
                <h3>Personne à cette adresse</h3>
                <p>Aucun membre ne correspond à ces filtres. Vérifie l&apos;orthographe ou élargis la recherche.</p>
                <button type="button" className="gk-btn" onClick={resetFilters}>Tout réafficher</button>
              </div>
            ) : (
              <div key={`${activeRank}-${activeCountry ?? "all"}`}>
                {visibleRanks.map((rank) => {
                  const rankMembers = filteredMembers.filter((m) => m.rank === rank);
                  if (rankMembers.length === 0) return null;
                  const rk = rankAccents[rank as Rank];
                  return (
                    <section
                      key={rank}
                      className="hm-rank-block" data-gk-motion="reveal"
                      aria-label={`Grade ${rank}`}
                      style={{
                        "--rk": rk,
                        "--rk-text": isDark ? rk : `color-mix(in srgb, ${rk} 72%, #000)`,
                      } as React.CSSProperties}
                    >
                      <div className="hm-rank-head">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={rankLogos[rank as Rank]} alt="" loading="lazy" />
                        <h3>{rank}</h3>
                        <span className="gk-jp" aria-hidden="true">{rankRomaji[rank as Rank]}</span>
                        <span className="gk-tag">{rankMembers.length} {rankMembers.length > 1 ? "membres" : "membre"}</span>
                        <span className="hm-rank-line" aria-hidden="true" />
                      </div>
                      <div className="hm-grid gk-stagger">
                        {rankMembers.map((member) => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            index={cardIndex++}
                            viewMode={viewMode}
                            onClick={(el) => openMember(member, el)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <MemberQuickView member={selectedMember} onClose={closeMember} viewMode={viewMode} />
      </div>

      {mounted && showFloat && !selectedMember && createPortal(
        <div className={`hm-float gk-switch tone-${isDark ? "dark" : "light"}`} role="group" aria-label="Type de portrait" style={{ "--gk-accent": accent } as React.CSSProperties}>
          <button type="button" aria-pressed={viewMode === "real"} onClick={() => setViewMode("real")}>
            <User size={16} aria-hidden="true" /> Réel
          </button>
          <button type="button" aria-pressed={viewMode === "anime"} onClick={() => setViewMode("anime")}>
            <Sword size={16} aria-hidden="true" /> Anime
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
