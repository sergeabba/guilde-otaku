"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Cpu, Download, Heart, Share2, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import "./atelier.css";

interface AtelierImage {
  id: string | number | null;
  filename: string;
  url: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  universe: string;
  accent: string;
  size: string;
}

// Ordre d'affichage des catégories connues ; les autres suivent, telles que saisies.
const KNOWN_ORDER = ["Création", "Portrait", "Scène", "VFX"];
const safeColor = (c?: string) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : "#dfb75b");
/** Identifiant stable d'une œuvre : son nom de fichier (l'id de base peut manquer). */
const keyOf = (w: AtelierImage) => w.filename;

export default function AtelierPage() {
  const [images, setImages] = useState<AtelierImage[] | null>(null);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [favOnly, setFavOnly] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { toggle, isFavorite, count: favCount } = useFavorites("atelier");
  const { share, notify, Toast } = useShare();
  const pendingLink = useRef<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    setImages(null);
    fetch("/api/atelier")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setImages(data.images ?? []))
      .catch(() => { setError(true); setImages([]); });
  }, []);

  useEffect(() => {
    pendingLink.current = new URLSearchParams(window.location.search).get("oeuvre");
    load();
  }, [load]);

  const categories = useMemo(() => {
    const present = [...new Set((images ?? []).map((w) => w.category).filter(Boolean))];
    return [...KNOWN_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !KNOWN_ORDER.includes(c)).sort()];
  }, [images]);

  const filtered = useMemo(
    () => (images ?? []).filter((w) => (activeFilter === "Tout" || w.category === activeFilter) && (!favOnly || isFavorite(keyOf(w)))),
    [images, activeFilter, favOnly, isFavorite]
  );

  const setOpen = useCallback((key: string | null) => {
    setOpenKey(key);
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("oeuvre", key); else url.searchParams.delete("oeuvre");
    window.history.replaceState({}, "", url);
  }, []);

  // Lien profond : /atelier?oeuvre=nom-du-fichier
  useEffect(() => {
    if (!images || !pendingLink.current) return;
    const wanted = pendingLink.current;
    pendingLink.current = null;
    const found = images.find((w) => keyOf(w) === wanted || String(w.id) === wanted);
    if (found) setOpenKey(keyOf(found));
  }, [images]);

  // La visionneuse parcourt la liste filtrée ; une œuvre ouverte par lien reste visible même hors filtre.
  const viewList = useMemo(() => {
    if (!openKey || !images) return filtered;
    return filtered.some((w) => keyOf(w) === openKey) ? filtered : images;
  }, [filtered, images, openKey]);
  const openIdx = openKey ? viewList.findIndex((w) => keyOf(w) === openKey) : -1;
  const current = openIdx >= 0 ? viewList[openIdx] : null;

  const step = useCallback((dir: 1 | -1) => {
    if (openIdx < 0 || viewList.length < 2) return;
    setOpen(keyOf(viewList[(openIdx + dir + viewList.length) % viewList.length]));
  }, [openIdx, viewList, setOpen]);

  const download = async (w: AtelierImage) => {
    try {
      const res = await fetch(w.url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = w.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      notify("Image téléchargée");
    } catch {
      // Hébergement qui refuse la lecture directe : on ouvre l'image, à enregistrer depuis le navigateur.
      window.open(w.url, "_blank", "noopener,noreferrer");
    }
  };

  const loading = images === null;
  const total = images?.length ?? 0;
  const hasFilters = activeFilter !== "Tout" || favOnly;

  return (
    <div className="gk-page tone-dark at-page">
      <GuildeHeader activePage="atelier" accentColor="#dfb75b" bgColor="#101014" tone="dark" />

      <main className="gk-wrap" style={{ maxWidth: 1560, paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <div className="gk-hero gk-reveal">
          <div className="gk-hero-kicker">
            <p className="gk-chapter"><b>08</b><span>L&apos;ARTBOOK DE LA GUILDE</span></p>
            <span className="gk-jp" aria-hidden="true">Kōbō</span>
          </div>
          <h1 className="gk-display at-title">L&apos;Atelier <span className="gk-inked">visuel</span></h1>
          <p className="gk-body gk-hero-lede">
            La galerie expérimentale de la Guilde Otaku : des créations générées par intelligence artificielle,
            avec le prompt qui les a fait naître.
          </p>
        </div>

        {!loading && total > 0 && (
          <div className="at-tools">
            <div className="gk-chips" role="group" aria-label="Filtrer par catégorie">
              <button type="button" className="gk-chip" aria-pressed={activeFilter === "Tout"} onClick={() => setActiveFilter("Tout")}>
                <span>Tout <small>{total}</small></span>
              </button>
              {categories.map((cat) => (
                <button key={cat} type="button" className="gk-chip" aria-pressed={activeFilter === cat} onClick={() => setActiveFilter(cat)}>
                  <span>{cat} <small>{images!.filter((w) => w.category === cat).length}</small></span>
                </button>
              ))}
            </div>
            <button type="button" className="gk-chip" aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)}>
              <Heart size={15} aria-hidden="true" fill={favOnly ? "currentColor" : "none"} />
              <span>Mes favoris <small>{favCount}</small></span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="at-wall" role="status" aria-label="Chargement de la galerie">
            {[1.3, 0.8, 1.1, 0.9, 1.4, 1].map((r, i) => (
              <div key={i} className="gk-skel" style={{ aspectRatio: `1 / ${r}`, marginBottom: 20, breakInside: "avoid" }} />
            ))}
          </div>
        ) : error ? (
          <div className="gk-empty" style={{ marginTop: 24 }}>
            <div className="gk-empty-glyph" aria-hidden="true">Heiten</div>
            <h3>L&apos;atelier est fermé</h3>
            <p>La galerie n&apos;a pas pu être chargée. Vérifie ta connexion puis réessaie.</p>
            <button type="button" className="gk-btn" onClick={load}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="gk-empty" style={{ marginTop: 24 }}>
            <div className="gk-empty-glyph" aria-hidden="true">Hakushi</div>
            <h3>{total === 0 ? "Page blanche" : favOnly && favCount === 0 ? "Aucun favori pour l'instant" : "Rien dans ce tiroir"}</h3>
            <p>
              {total === 0
                ? "Aucune création n'est encore exposée."
                : favOnly && favCount === 0
                  ? "Touche le cœur d'une œuvre pour la garder ici. Tes favoris restent sur cet appareil."
                  : "Aucune œuvre ne correspond à ces filtres."}
            </p>
            {hasFilters && <button type="button" className="gk-btn" onClick={() => { setActiveFilter("Tout"); setFavOnly(false); }}>Tout réafficher</button>}
          </div>
        ) : (
          <div className="at-wall" data-gk-motion="reveal" key={`${activeFilter}-${favOnly}`}>
            {filtered.map((w, i) => {
              const fav = isFavorite(keyOf(w));
              return (
                <article key={keyOf(w)} className="at-plate" style={{ "--at": safeColor(w.accent) } as React.CSSProperties}>
                  <button
                    type="button"
                    className="at-fav no-min"
                    aria-pressed={fav}
                    onClick={() => toggle(keyOf(w))}
                    aria-label={fav ? `Retirer ${w.title} des favoris` : `Ajouter ${w.title} aux favoris`}
                  >
                    <Heart size={17} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                  <button type="button" className="at-plate-open" onClick={() => setOpen(keyOf(w))} aria-label={`Agrandir ${w.title}`}>
                    <div className="at-plate-img">
                      <span className="at-plate-no" aria-hidden="true">Planche {String(i + 1).padStart(2, "0")}</span>
                      {/* Les originaux pèsent plusieurs Mo : on sert une version redimensionnée.
                          width/height ne sont qu'un cadre d'attente, l'image garde son vrai ratio. */}
                      <Image
                        src={w.url}
                        alt=""
                        width={800}
                        height={1000}
                        sizes="(max-width: 559px) 100vw, (max-width: 899px) 50vw, (max-width: 1499px) 33vw, 25vw"
                        priority={i < 2}
                        style={{ width: "100%", height: "auto" }}
                      />
                    </div>
                    <div className="at-plate-cap">
                      <strong>{w.title}</strong>
                      <small>{[w.category, w.universe].filter(Boolean).join(", ")}</small>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {current && (
        <Viewer
          work={current}
          index={openIdx}
          count={viewList.length}
          isFavorite={isFavorite(keyOf(current))}
          onToggleFavorite={() => toggle(keyOf(current))}
          onClose={() => setOpen(null)}
          onStep={step}
          onShare={() => share({ title: `${current.title} | Atelier de la Guilde`, text: current.description || `Une création de l'Atelier de la Guilde Otaku.` })}
          onDownload={() => download(current)}
        />
      )}
      <Toast />
    </div>
  );
}

function Viewer({ work, index, count, isFavorite, onToggleFavorite, onClose, onStep, onShare, onDownload }: {
  work: AtelierImage;
  index: number;
  count: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>(".at-close")?.focus();
    return () => { document.body.style.overflow = prevOverflow; previous?.focus?.(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onStep(-1);
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("button, a[href]")];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      className="at-view tone-dark at-page"
      role="dialog"
      aria-modal="true"
      aria-label={`${work.title}, œuvre ${index + 1} sur ${count}`}
      style={{ "--at": safeColor(work.accent), background: "rgba(8,8,10,0.96)" } as React.CSSProperties}
    >
      <div
        className="at-stage"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const d = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(d) > 55) onStep(d > 0 ? -1 : 1);
        }}
      >
        <span className="at-count" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
        <button type="button" className="gk-icon-btn at-close" onClick={onClose} aria-label="Fermer la visionneuse">
          <X size={20} aria-hidden="true" />
        </button>
        <Image
          key={work.filename}
          src={work.url}
          alt={work.description || work.title}
          width={1600}
          height={1600}
          sizes="(min-width: 900px) 70vw, 100vw"
          priority
          style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
        />
        {count > 1 && (
          <>
            <button type="button" className="gk-icon-btn at-stage-nav is-prev" onClick={() => onStep(-1)} aria-label="Œuvre précédente">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" className="gk-icon-btn at-stage-nav is-next" onClick={() => onStep(1)} aria-label="Œuvre suivante">
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="at-info">
        <div>
          {work.category && <span className="gk-tag" style={{ color: "var(--at)" }}>{work.category}</span>}
          <h2 style={{ marginTop: 10 }}>{work.title}</h2>
        </div>
        {work.description && <p className="gk-body">{work.description}</p>}
        {work.prompt && (
          <div className="at-prompt">
            <b><Cpu size={14} aria-hidden="true" /> Prompt source</b>
            <p>{work.prompt}</p>
          </div>
        )}
        <dl className="at-meta">
          {work.universe && (<><dt>Univers</dt><dd>{work.universe}</dd></>)}
          <dt>Fichier</dt><dd>{work.filename}</dd>
        </dl>
        <div className="at-actions">
          <button type="button" className="gk-btn gk-btn--sm" aria-pressed={isFavorite} onClick={onToggleFavorite}>
            <Heart size={15} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" /> {isFavorite ? "En favori" : "Mettre en favori"}
          </button>
          <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={onShare}>
            <Share2 size={15} aria-hidden="true" /> Partager
          </button>
          <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={onDownload}>
            <Download size={15} aria-hidden="true" /> Télécharger
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
