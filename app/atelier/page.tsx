"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, flushSync } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Cpu, Download, Heart, Share2, Shuffle, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import { viewTransition } from "../../lib/view-transition";
import { applyPalette, paletteOf } from "../../lib/palette";
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

// Même `sizes` pour la planche et la couche basse de la visionneuse : le navigateur
// choisit alors le même fichier, déjà en cache, et l'agrandissement est immédiat.
const PLATE_SIZES = "(max-width: 359px) 100vw, (max-width: 899px) 50vw, (max-width: 1499px) 33vw, 25vw";
const VIEW_SIZES = "(min-width: 900px) 70vw, 100vw";

// Nombre de colonnes du mur. Répartition en ligne (1, 2, 3… de gauche à droite),
// stable quand une image finit de charger, contrairement aux colonnes CSS.
const COL_QUERIES: [string, number][] = [["(min-width: 1500px)", 4], ["(min-width: 900px)", 3], ["(min-width: 360px)", 2]];
const subscribeCols = (cb: () => void) => {
  const mqs = COL_QUERIES.map(([q]) => window.matchMedia(q));
  mqs.forEach((m) => m.addEventListener("change", cb));
  return () => mqs.forEach((m) => m.removeEventListener("change", cb));
};
const readCols = () => COL_QUERIES.find(([q]) => window.matchMedia(q).matches)?.[1] ?? 1;
const useColumns = () => useSyncExternalStore(subscribeCols, readCols, () => 3);

const plateImg = (key: string) =>
  document.querySelector<HTMLImageElement>(`.at-plate[data-key="${CSS.escape(key)}"] .at-plate-img img`);
const ratioOf = (img: HTMLImageElement | null) => (img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : null);
const onScreen = (el: Element | null, margin = 0) => {
  const r = el?.getBoundingClientRect();
  return !!r && r.bottom > -margin && r.top < window.innerHeight + margin && r.width > 0;
};
/** Attend que l'image de la visionneuse soit décodée (au plus `max` ms) avant la photo d'arrivée. */
const decoded = (max = 260) => {
  const img = document.querySelector<HTMLImageElement>(".at-art img");
  if (!img) return Promise.resolve();
  return Promise.race([img.decode().catch(() => {}), new Promise<void>((r) => setTimeout(r, max))]);
};
const pick = <T,>(list: T[], n: number) => [...list].sort(() => Math.random() - 0.5).slice(0, n);

export default function AtelierPage() {
  const [images, setImages] = useState<AtelierImage[] | null>(null);
  const [fan, setFan] = useState<AtelierImage[]>([]);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpenState] = useState<{ key: string; ratio: number | null } | null>(null);
  const { toggle, isFavorite, count: favCount } = useFavorites("atelier");
  const { share, notify, Toast } = useShare();
  const pendingLink = useRef<string | null>(null);
  const cols = useColumns();
  const openKey = open?.key ?? null;

  const load = useCallback(() => {
    setError(false);
    setImages(null);
    fetch("/api/atelier")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { const list: AtelierImage[] = data.images ?? []; setImages(list); setFan(pick(list, 3)); })
      .catch(() => { setError(true); setImages([]); });
  }, []);

  useEffect(() => {
    pendingLink.current = new URLSearchParams(window.location.search).get("oeuvre");
    load();
  }, [load]);

  const indexOf = useMemo(() => new Map((images ?? []).map((w, i) => [keyOf(w), i])), [images]);

  const categories = useMemo(() => {
    const present = [...new Set((images ?? []).map((w) => w.category).filter(Boolean))];
    return [...KNOWN_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !KNOWN_ORDER.includes(c)).sort()];
  }, [images]);

  const filtered = useMemo(
    () => (images ?? []).filter((w) => (activeFilter === "Tout" || w.category === activeFilter) && (!favOnly || isFavorite(keyOf(w)))),
    [images, activeFilter, favOnly, isFavorite]
  );

  const setOpen = useCallback((key: string | null, ratio: number | null = null) => {
    setOpenState(key ? { key, ratio } : null);
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
    if (found) setOpenState({ key: keyOf(found), ratio: null });
  }, [images]);

  // La visionneuse parcourt la liste filtrée ; une œuvre ouverte par lien reste visible même hors filtre.
  const viewList = useMemo(() => {
    if (!openKey || !images) return filtered;
    return filtered.some((w) => keyOf(w) === openKey) ? filtered : images;
  }, [filtered, images, openKey]);
  const openIdx = openKey ? viewList.findIndex((w) => keyOf(w) === openKey) : -1;
  const current = openIdx >= 0 ? viewList[openIdx] : null;
  const neighbours = current && viewList.length > 1
    ? [viewList[(openIdx + 1) % viewList.length], viewList[(openIdx - 1 + viewList.length) % viewList.length]]
    : [];

  // ── Transitions ───────────────────────────────────────────────────────────
  // Ouverture : la planche touchée s'envole et devient l'image plein écran.
  const openWork = useCallback((w: AtelierImage, source?: HTMLImageElement | null) => {
    const img = source ?? plateImg(keyOf(w));
    viewTransition({
      kind: "at-open",
      from: onScreen(img) ? [[img, "at-art"]] : [],
      update: async () => { flushSync(() => setOpen(keyOf(w), ratioOf(img))); await decoded(); },
      to: () => [[document.querySelector(".at-art"), "at-art"]],
    });
  }, [setOpen]);

  // Fermeture : l'image revient se poser dans sa planche si elle est à l'écran.
  const close = useCallback(() => {
    const key = openKey;
    viewTransition({
      kind: "at-close",
      from: [[document.querySelector(".at-art"), "at-art"]],
      update: () => flushSync(() => setOpen(null)),
      to: () => { const img = key ? plateImg(key) : null; return onScreen(img) ? [[img, "at-art"]] : []; },
    });
  }, [openKey, setOpen]);

  // Œuvre suivante / précédente : la planche glisse dans le sens choisi (ou du geste).
  const step = useCallback((dir: 1 | -1) => {
    if (openIdx < 0 || viewList.length < 2) return;
    const next = viewList[(openIdx + dir + viewList.length) % viewList.length];
    viewTransition({
      kind: dir > 0 ? "at-next" : "at-prev",
      from: [[document.querySelector(".at-frame"), "at-frame"]],
      update: async () => {
        const frame = document.querySelector<HTMLElement>(".at-frame");
        if (frame) { frame.style.transform = ""; frame.style.opacity = ""; }
        flushSync(() => setOpen(keyOf(next), ratioOf(plateImg(keyOf(next)))));
        await decoded();
      },
      to: () => [[document.querySelector(".at-frame"), "at-frame"]],
    });
  }, [openIdx, viewList, setOpen]);

  // Filtres : chaque planche visible glisse vers sa nouvelle place ; les autres
  // apparaissent ou s'effacent. Seules les planches proches de l'écran sont suivies.
  const visiblePlates = () =>
    [...document.querySelectorAll<HTMLElement>(".at-plate")].filter((el) => onScreen(el, 200)).map((el) => [el, `atp-${el.dataset.k}`] as [HTMLElement, string]);
  const refilter = (fn: () => void) => viewTransition({ kind: "at-filter", from: visiblePlates(), update: () => flushSync(fn), to: visiblePlates });

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
  const columns = Array.from({ length: cols }, (_, c) => filtered.map((w, i) => ({ w, i })).filter(({ i }) => i % cols === c));

  return (
    <div className="gk-page tone-dark at-page">
      <GuildeHeader activePage="atelier" accentColor="#dfb75b" bgColor="#101014" tone="dark" />

      <main className="gk-wrap" style={{ maxWidth: 1560, paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <div className="at-hero">
          <div className="gk-hero gk-reveal">
            <div className="gk-hero-kicker">
              <p className="gk-chapter"><b>08</b><span>L&apos;ARTBOOK DE LA GUILDE</span></p>
              <span className="gk-jp" aria-hidden="true">Kōbō</span>
            </div>
            <h1 className="gk-display at-title">Les futilités <span className="gk-inked">de la Guilde</span></h1>
            <p className="gk-body gk-hero-lede">
              La galerie expérimentale de la Guilde Otaku : des créations générées par intelligence artificielle,
              avec le prompt qui les a fait naître.
            </p>
          </div>
          {fan.length === 3 && (
            <div className="at-fan" role="group" aria-label="Trois futilités tirées au hasard">
              {fan.map((w, i) => (
                <button key={keyOf(w)} type="button" className="at-fan-card" style={{ "--i": i, "--at": safeColor(w.accent) } as React.CSSProperties} onClick={(e) => openWork(w, e.currentTarget.querySelector("img"))} aria-label={`Agrandir ${w.title}`}>
                  <Image src={w.url} alt="" fill sizes="260px" priority onLoad={(e) => applyPalette(e.currentTarget.closest<HTMLElement>(".at-fan-card"), paletteOf(e.currentTarget, keyOf(w)))} />
                </button>
              ))}
            </div>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="at-tools">
            <div className="gk-chips" role="group" aria-label="Filtrer par catégorie">
              <button type="button" className="gk-chip" aria-pressed={activeFilter === "Tout"} onClick={() => refilter(() => setActiveFilter("Tout"))}>
                <span>Tout <small>{total}</small></span>
              </button>
              {categories.map((cat) => (
                <button key={cat} type="button" className="gk-chip" aria-pressed={activeFilter === cat} onClick={() => refilter(() => setActiveFilter(cat))}>
                  <span>{cat} <small>{images!.filter((w) => w.category === cat).length}</small></span>
                </button>
              ))}
            </div>
            <div className="at-tools-end">
              <button type="button" className="gk-chip" aria-pressed={favOnly} onClick={() => refilter(() => setFavOnly((v) => !v))}>
                <Heart size={15} aria-hidden="true" fill={favOnly ? "currentColor" : "none"} />
                <span>Mes favoris <small>{favCount}</small></span>
              </button>
              {filtered.length > 1 && (
                <button type="button" className="gk-chip" onClick={() => openWork(filtered[Math.floor(Math.random() * filtered.length)])}>
                  <Shuffle size={15} aria-hidden="true" />
                  <span>Une au hasard</span>
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="at-wall" role="status" aria-label="Chargement de la galerie">
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} className="at-col">
                {[1.3, 0.9, 1.15].map((r, i) => <div key={i} className="gk-skel" style={{ aspectRatio: `1 / ${(r + c * 0.17) % 0.6 + 0.9}` }} />)}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="gk-empty" style={{ marginTop: 24 }}>
            <div className="gk-empty-glyph" aria-hidden="true">Heiten</div>
            <h3>La galerie est fermée</h3>
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
            {hasFilters && <button type="button" className="gk-btn" onClick={() => refilter(() => { setActiveFilter("Tout"); setFavOnly(false); })}>Tout réafficher</button>}
          </div>
        ) : (
          <div className="at-wall">
            {columns.map((col, c) => (
              <div key={c} className="at-col">
                {col.map(({ w, i }) => {
                  const fav = isFavorite(keyOf(w));
                  return (
                    <article key={keyOf(w)} className="at-plate" data-key={keyOf(w)} data-k={indexOf.get(keyOf(w))} style={{ "--at": safeColor(w.accent) } as React.CSSProperties}>
                      <div className="at-card">
                        <button
                          type="button"
                          className="at-fav no-min"
                          aria-pressed={fav}
                          onClick={() => toggle(keyOf(w))}
                          aria-label={fav ? `Retirer ${w.title} des favoris` : `Ajouter ${w.title} aux favoris`}
                        >
                          <Heart size={17} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                        <button type="button" className="at-plate-open" onClick={() => openWork(w)} aria-label={`Agrandir ${w.title}`}>
                          <div className="at-plate-img">
                            <span className="at-plate-no" aria-hidden="true">Planche {String(i + 1).padStart(2, "0")}</span>
                            {/* Les originaux pèsent plusieurs Mo : on sert une version redimensionnée.
                                width/height ne sont qu'un cadre d'attente, l'image garde son vrai ratio. */}
                            <Image
                              src={w.url}
                              alt=""
                              width={800}
                              height={1000}
                              sizes={PLATE_SIZES}
                              priority={i < cols}
                              onLoad={(e) => { const img = e.currentTarget; img.parentElement?.setAttribute("data-loaded", ""); applyPalette(img.closest<HTMLElement>(".at-plate"), paletteOf(img, keyOf(w))); }}
                              style={{ width: "100%", height: "auto" }}
                            />
                          </div>
                          <div className="at-plate-cap">
                            <strong>{w.title}</strong>
                            <small>{[w.category, w.universe].filter(Boolean).join(", ")}</small>
                          </div>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>

      {current && (
        <Viewer
          work={current}
          ratio={open?.ratio ?? null}
          neighbours={neighbours}
          index={openIdx}
          count={viewList.length}
          isFavorite={isFavorite(keyOf(current))}
          onToggleFavorite={() => toggle(keyOf(current))}
          onClose={close}
          onStep={step}
          onShare={() => share({ title: `${current.title} | Les futilités de la Guilde`, text: current.description || `Une des futilités de la Guilde Otaku.` })}
          onDownload={() => download(current)}
        />
      )}
      <Toast />
    </div>
  );
}

/**
 * Image de la visionneuse, en deux couches : dessous, la version de la planche (déjà
 * en cache, affichée tout de suite) ; dessus, la grande version qui apparaît une fois
 * chargée. Le cadre prend le ratio réel de l'image et tient dans la scène (cqw/cqh).
 */
function Art({ work, ratio }: { work: AtelierImage; ratio: number | null }) {
  const [r, setR] = useState(ratio ?? 0.8);
  const [sharp, setSharp] = useState(false);
  const learn = (img: HTMLImageElement) => {
    if (!ratio && img.naturalWidth) setR(img.naturalWidth / img.naturalHeight);
    // La visionneuse prend les couleurs de l'œuvre (fond, cadre, titre, boutons).
    applyPalette(img.closest<HTMLElement>(".at-view"), paletteOf(img, work.filename));
  };
  return (
    <div className="at-art" style={{ "--r": r } as React.CSSProperties}>
      <Image src={work.url} alt="" aria-hidden="true" fill sizes={PLATE_SIZES} className="at-art-lo" onLoad={(e) => learn(e.currentTarget)} />
      <Image
        src={work.url}
        alt={work.description || work.title}
        fill
        sizes={VIEW_SIZES}
        priority
        className="at-art-hi"
        data-sharp={sharp || undefined}
        onLoad={(e) => { learn(e.currentTarget); setSharp(true); }}
      />
    </div>
  );
}

function Viewer({ work, ratio, neighbours, index, count, isFavorite, onToggleFavorite, onClose, onStep, onShare, onDownload }: {
  work: AtelierImage;
  ratio: number | null;
  neighbours: AtelierImage[];
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
  const frameRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; dx: number; locked: boolean | null } | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>(".at-close")?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = prevOverflow; previous?.focus?.({ preventScroll: true }); };
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

  // Balayage : l'image suit le doigt, puis part dans le sens du geste ou revient en place.
  const drag = (dx: number) => {
    const f = frameRef.current;
    if (!f) return;
    f.style.transition = "none";
    f.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
    f.style.opacity = String(1 - Math.min(Math.abs(dx) / 900, 0.35));
  };
  const release = () => {
    const t = touch.current;
    touch.current = null;
    if (!t || !t.locked) return;
    if (Math.abs(t.dx) > 60 && count > 1) { onStep(t.dx < 0 ? 1 : -1); return; }
    const f = frameRef.current;
    if (!f) return;
    f.style.transition = "transform 320ms cubic-bezier(.2,.9,.25,1.25), opacity 200ms";
    f.style.transform = "";
    f.style.opacity = "";
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      className="at-view tone-dark at-page"
      role="dialog"
      aria-modal="true"
      aria-label={`${work.title}, œuvre ${index + 1} sur ${count}`}
      style={{ "--at": safeColor(work.accent) } as React.CSSProperties}
    >
      <div
        className="at-stage"
        onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("at-frame")) onClose(); }}
        onTouchStart={(e) => { const p = e.touches[0]; touch.current = p ? { x: p.clientX, y: p.clientY, dx: 0, locked: null } : null; }}
        onTouchMove={(e) => {
          const t = touch.current, p = e.touches[0];
          if (!t || !p) return;
          const dx = p.clientX - t.x, dy = p.clientY - t.y;
          if (t.locked === null && Math.hypot(dx, dy) > 8) t.locked = Math.abs(dx) > Math.abs(dy);
          if (t.locked) { t.dx = dx; drag(dx); }
        }}
        onTouchEnd={release}
        onTouchCancel={release}
      >
        <span className="at-count" aria-hidden="true">
          <b key={index}>{String(index + 1).padStart(2, "0")}</b> / {String(count).padStart(2, "0")}
        </span>
        <button type="button" className="gk-icon-btn at-close" onClick={onClose} aria-label="Fermer la visionneuse">
          <X size={20} aria-hidden="true" />
        </button>
        <div className="at-frame" ref={frameRef}>
          <Art key={work.filename} work={work} ratio={ratio} />
        </div>
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
        {/* Œuvres voisines chargées d'avance : le passage à la suivante est instantané. */}
        <div className="at-preload" aria-hidden="true">
          {neighbours.map((n) => (
            <div key={n.filename}>
              <Image src={n.url} alt="" fill sizes={PLATE_SIZES} loading="eager" />
              <Image src={n.url} alt="" fill sizes={VIEW_SIZES} loading="eager" />
            </div>
          ))}
        </div>
      </div>

      <div className="at-info" key={work.filename}>
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
