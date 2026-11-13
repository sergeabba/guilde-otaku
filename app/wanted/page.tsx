"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Maximize2, Pause, Play, Search, Share2, Sword, User, Volume2, VolumeX, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { fetchMembers } from "../utils/dataAdapter";
import { normalize } from "../utils/text";
import { useShare } from "../hooks/useShare";
import type { Member } from "../../data/members";
import "./wanted.css";

type ViewMode = "real" | "anime";
type SortMode = "registre" | "prime-desc" | "prime-asc";

// Les primes font partie du jeu : elles sont dérivées du numéro de membre,
// donc stables d'une visite à l'autre. Ce ne sont pas des votes.
function getPrimeValue(id: number): number {
  const bases = [50, 80, 120, 150, 200, 250, 300, 400, 500, 750, 800, 999];
  return bases[id % bases.length] * (((id * 7) % 9) + 1) * 1_000_000;
}
const formatPrime = (v: number) => v.toLocaleString("en-US") + "-";
const posterName = (name: string) => name.replace(/"/g, "·");

function Poster({ member, viewMode, eager = false }: { member: Member; viewMode: ViewMode; eager?: boolean }) {
  const src = viewMode === "anime" ? member.animeChar : member.photo;
  const [failed, setFailed] = useState<string | null>(null);
  const name = posterName(member.name);
  return (
    <span className="wp">
      <span className="wp-paper" style={{ display: "block" }}>
        <span className="wp-in">
          <span className="wp-title" aria-hidden="true">WANTED</span>
          <span className="wp-sub" aria-hidden="true">DEAD OR ALIVE</span>
          <span className="wp-photo">
            {src && failed !== src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                className="is-swap"
                src={src}
                alt=""
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                onError={() => setFailed(src)}
              />
            ) : (
              <span className="wp-photo-empty" aria-hidden="true">?</span>
            )}
          </span>
          <span className={`wp-name${name.length > 13 ? " is-long" : ""}`}>{name}</span>
          <span className="wp-prime"><span>฿</span>{formatPrime(getPrimeValue(member.id))}</span>
          <span className="wp-foot" aria-hidden="true">
            <small>KONO SOSHIKI WA FICTION DETHU NODE JITSU ZAISURU...</small>
            <b>MARINE</b>
          </span>
        </span>
      </span>
    </span>
  );
}

/** Dessine l'affiche sur un canvas pour la proposer en PNG. */
async function renderPosterPng(member: Member, viewMode: ViewMode): Promise<Blob> {
  const W = 1000, H = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#e8cba3"); grad.addColorStop(0.5, "#d1ae7b"); grad.addColorStop(1, "#bc9257");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const ink = "#36220f";
  ctx.strokeStyle = ink; ctx.lineWidth = 10;
  ctx.strokeRect(47, 47, W - 94, H - 94);
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  ctx.save();
  ctx.translate(W / 2, 255); ctx.scale(1, 1.4);
  ctx.font = "900 184px 'Times New Roman', Times, serif";
  ctx.fillText("WANTED", 0, 0);
  ctx.restore();
  ctx.font = "700 37px 'Times New Roman', Times, serif";
  ctx.fillText("D E A D   O R   A L I V E", W / 2, 312);

  const px = 82, py = 345, pw = W - 164, ph = 760;
  ctx.fillStyle = "#4a331c"; ctx.fillRect(px, py, pw, ph);
  const src = viewMode === "anime" ? member.animeChar : member.photo;
  if (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("image")); img.src = src; });
    const scale = Math.max(pw / img.width, ph / img.height);
    const sw = pw / scale, sh = ph / scale;
    const sx = (img.width - sw) / 2, sy = (img.height - sh) * 0.1;
    ctx.filter = "sepia(0.8) contrast(1.2) brightness(0.9) grayscale(0.2)";
    ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
    ctx.filter = "none";
  }
  ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.strokeRect(px, py, pw, ph);

  ctx.fillStyle = ink;
  const name = posterName(member.name).toUpperCase();
  let size = 92;
  ctx.font = `900 ${size}px 'Times New Roman', Times, serif`;
  while (ctx.measureText(name).width > pw - 20 && size > 40) { size -= 4; ctx.font = `900 ${size}px 'Times New Roman', Times, serif`; }
  ctx.save(); ctx.translate(W / 2, 1218); ctx.scale(1, 1.25); ctx.fillText(name, 0, 0); ctx.restore();
  ctx.font = "900 80px 'Times New Roman', Times, serif";
  ctx.fillText("฿ " + formatPrime(getPrimeValue(member.id)), W / 2, 1322);

  ctx.fillRect(px, 1356, pw, 5);
  ctx.font = "900 47px 'Times New Roman', Times, serif"; ctx.textAlign = "right";
  ctx.fillText("MARINE", px + pw, 1420);
  ctx.font = "16px monospace"; ctx.textAlign = "left";
  ctx.fillText("GUILDE OTAKU · guilde-otaku.vercel.app/wanted", px, 1416);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/png"));
}

export default function WantedPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("real");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortMode>("registre");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const { share, notify, Toast } = useShare();

  useEffect(() => {
    let cancelled = false;
    fetchMembers().then((list) => {
      if (cancelled) return;
      setMembers(list);
      // Lien profond : /wanted?avis=12
      const wanted = Number(new URLSearchParams(window.location.search).get("avis"));
      setCurrentId(list.find((m) => m.id === wanted)?.id ?? list[0]?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const list = useMemo(() => {
    const q = normalize(searchTerm.trim());
    const base = (members ?? []).filter((m) => !q || normalize(m.name).includes(q) || normalize(m.rank).includes(q));
    if (sort === "registre") return base;
    return [...base].sort((a, b) =>
      sort === "prime-desc" ? getPrimeValue(b.id) - getPrimeValue(a.id) : getPrimeValue(a.id) - getPrimeValue(b.id)
    );
  }, [members, searchTerm, sort]);

  const index = Math.max(0, list.findIndex((m) => m.id === currentId));
  const member = list[index];

  // Si le filtre exclut l'affiche courante, on prend la première de la liste
  useEffect(() => {
    if (list.length && !list.some((m) => m.id === currentId)) setCurrentId(list[0].id);
  }, [list, currentId]);

  // L'adresse suit l'affiche affichée, pour pouvoir la partager
  useEffect(() => {
    if (currentId == null) return;
    const url = new URL(window.location.href);
    url.searchParams.set("avis", String(currentId));
    window.history.replaceState({}, "", url);
  }, [currentId]);

  const step = useCallback((dir: 1 | -1) => {
    if (!list.length) return;
    setCurrentId(list[(index + dir + list.length) % list.length].id);
  }, [list, index]);

  useEffect(() => {
    if (!isAutoPlay || list.length <= 1) return;
    const t = setInterval(() => step(1), 4000);
    return () => clearInterval(t);
  }, [isAutoPlay, list.length, step]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step]);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [lightbox]);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); return; }
    audio.volume = 0.5;
    audio.play().then(() => setIsPlaying(true)).catch(() => notify("Lecture bloquée par le navigateur"));
  };

  const pick = (id: number) => {
    setCurrentId(id);
    setIsAutoPlay(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stageRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const download = async () => {
    if (!member || downloading) return;
    setDownloading(true);
    try {
      const blob = await renderPosterPng(member, viewMode);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `wanted-${normalize(member.name).replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      notify("Affiche téléchargée");
    } catch {
      notify("Portrait protégé : téléchargement impossible");
    } finally {
      setDownloading(false);
    }
  };

  const loading = members === null;

  return (
    <div className="gk-page tone-dark wt-page">
      <audio ref={audioRef} src="/wanted.mp3" loop preload="none" />
      <GuildeHeader activePage="wanted" accentColor="#c9a84c" bgColor="#0d0a04" tone="dark" />

      <main className="gk-wrap" style={{ paddingBlock: "clamp(24px, 5vw, 56px) clamp(48px, 8vw, 96px)" }}>
        <div className="wt-hero gk-reveal">
          <div>
            <p className="gk-chapter"><b>03</b><span>AVIS DE RECHERCHE</span></p>
            <h1 className="wt-title" style={{ marginTop: 26 }}>WANTED</h1>
          </div>
          <p className="gk-body" style={{ maxWidth: "38ch" }}>
            Chaque membre a sa tête mise à prix. Feuillette les avis, change de portrait, emporte l&apos;affiche.
          </p>
        </div>

        <div className="wt-bar">
          <div className="gk-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              className="gk-input"
              placeholder="Chercher un nom ou un grade"
              aria-label="Chercher une affiche par nom ou par grade"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="gk-clear no-min" onClick={() => setSearchTerm("")} aria-label="Effacer la recherche">
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
          <select className="wt-select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Trier les affiches">
            <option value="registre">Ordre du registre</option>
            <option value="prime-desc">Plus grosses primes</option>
            <option value="prime-asc">Plus petites primes</option>
          </select>
          <span />
          <div className="wt-bar-right">
            <div className="gk-switch" role="group" aria-label="Type de portrait">
              <button type="button" aria-pressed={viewMode === "real"} onClick={() => setViewMode("real")}>
                <User size={15} aria-hidden="true" /> Réel
              </button>
              <button type="button" aria-pressed={viewMode === "anime"} onClick={() => setViewMode("anime")}>
                <Sword size={15} aria-hidden="true" /> Anime
              </button>
            </div>
            <button
              type="button"
              className="gk-icon-btn"
              aria-pressed={isAutoPlay}
              onClick={() => setIsAutoPlay((v) => !v)}
              aria-label={isAutoPlay ? "Arrêter le diaporama" : "Lancer le diaporama"}
              title={isAutoPlay ? "Arrêter le diaporama" : "Lancer le diaporama"}
            >
              {isAutoPlay ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="gk-icon-btn"
              aria-pressed={isPlaying}
              onClick={toggleSound}
              aria-label={isPlaying ? "Couper la musique" : "Lancer la musique"}
              title={isPlaying ? "Couper la musique" : "Lancer la musique"}
            >
              {isPlaying ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div ref={stageRef} style={{ scrollMarginTop: 120 }}>
          {loading ? (
            <div className="wt-stage" role="status" aria-label="Chargement des affiches">
              <div className="wt-poster-slot"><div className="gk-skel" style={{ width: "min(400px, 80%)", aspectRatio: "2 / 3" }} /></div>
              <div>
                <div className="gk-skel" style={{ height: 70, width: "80%" }} />
                <div className="gk-skel" style={{ height: 120, marginTop: 20 }} />
              </div>
            </div>
          ) : !member ? (
            <div className="gk-empty" style={{ marginTop: 32 }}>
              <div className="gk-empty-glyph" aria-hidden="true">逃亡</div>
              <h3>Ce pirate court toujours</h3>
              <p>
                {members.length === 0
                  ? "Les affiches n'ont pas pu être chargées. Recharge la page dans un instant."
                  : `Aucune affiche ne correspond à « ${searchTerm} ».`}
              </p>
              {searchTerm && <button type="button" className="gk-btn" onClick={() => setSearchTerm("")}>Revoir toutes les affiches</button>}
            </div>
          ) : (
            <div className="wt-stage">
              <div className="wt-poster-slot">
                <button type="button" className="wt-arrow" onClick={() => step(-1)} aria-label="Affiche précédente">
                  <ChevronLeft size={26} aria-hidden="true" />
                </button>
                <div className="wt-poster-wrap">
                  <button
                    key={member.id}
                    type="button"
                    className="wt-main-poster"
                    onClick={() => setLightbox(true)}
                    aria-label={`Agrandir l'affiche de ${member.name}`}
                    style={{ transform: `rotate(${((member.id % 4) - 1.5) * 1.2}deg)` }}
                  >
                    <Poster member={member} viewMode={viewMode} eager />
                  </button>
                </div>
                <button type="button" className="wt-arrow" onClick={() => step(1)} aria-label="Affiche suivante">
                  <ChevronRight size={26} aria-hidden="true" />
                </button>
              </div>

              <div className="wt-notice" aria-live="polite">
                <p className="wt-counter">AVIS {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}</p>
                <h2 style={{ marginTop: 8 }}>{member.name}</h2>
                <dl>
                  <dt>Prime</dt>
                  <dd className="wt-prime">฿ {formatPrime(getPrimeValue(member.id))}</dd>
                  <dt>Grade</dt>
                  <dd>{member.rank}</dd>
                  {member.badge && (<><dt>Distinction</dt><dd>{member.badge}</dd></>)}
                </dl>
                <div className="wt-actions">
                  <button type="button" className="gk-btn" onClick={() => setLightbox(true)}>
                    <Maximize2 size={16} aria-hidden="true" /> Agrandir
                  </button>
                  <button
                    type="button"
                    className="gk-btn gk-btn--ghost"
                    onClick={() => share({ title: `WANTED : ${member.name}`, text: `${member.name}, prime de ฿${formatPrime(getPrimeValue(member.id))}`, url: `/wanted?avis=${member.id}` })}
                  >
                    <Share2 size={16} aria-hidden="true" /> Partager
                  </button>
                  <button type="button" className="gk-btn gk-btn--ghost" onClick={download} aria-busy={downloading}>
                    <Download size={16} aria-hidden="true" /> {downloading ? "Préparation" : "Télécharger"}
                  </button>
                  <a href={`/membres/${member.id}`} className="gk-btn gk-btn--ghost">Voir la fiche</a>
                </div>
                <p className="wt-note">
                  Les primes sont un jeu : elles sont calculées à partir du numéro de membre, pas d&apos;un vote.
                  Flèches gauche et droite pour feuilleter.
                </p>
              </div>
            </div>
          )}
        </div>

        {!loading && list.length > 0 && (
          <section aria-labelledby="wt-wall-title" style={{ marginTop: "clamp(48px, 8vw, 96px)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <h2 id="wt-wall-title" className="gk-display gk-h3">Le mur des primes</h2>
              <span className="gk-tag">{list.length} {list.length > 1 ? "avis placardés" : "avis placardé"}</span>
            </div>
            <div className="wt-wall">
              {list.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="wt-wall-item"
                  onClick={() => pick(m.id)}
                  aria-current={m.id === member?.id ? "true" : undefined}
                  aria-label={`Afficher l'avis de ${m.name}, prime ${formatPrime(getPrimeValue(m.id))}`}
                  style={{ "--tilt": `${((m.id * 37) % 5) - 2}deg` } as React.CSSProperties}
                >
                  <Poster member={m} viewMode={viewMode} />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {lightbox && member && typeof document !== "undefined" && createPortal(
        <div
          ref={lightboxRef}
          className="wt-lightbox tone-dark"
          role="dialog"
          aria-modal="true"
          aria-label={`Affiche de ${member.name}`}
          onClick={(e) => { if (e.target === e.currentTarget) setLightbox(false); }}
        >
          <button type="button" className="gk-icon-btn wt-lightbox-close" onClick={() => setLightbox(false)} aria-label="Fermer l'affiche">
            <X size={20} aria-hidden="true" />
          </button>
          <button type="button" className="wt-arrow" onClick={() => step(-1)} aria-label="Affiche précédente">
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
          <div key={member.id} className="wt-lightbox-poster" onClick={(e) => e.stopPropagation()}>
            <Poster member={member} viewMode={viewMode} eager />
          </div>
          <button type="button" className="wt-arrow" onClick={() => step(1)} aria-label="Affiche suivante">
            <ChevronRight size={26} aria-hidden="true" />
          </button>
        </div>,
        document.body
      )}
      <Toast />
    </div>
  );
}
