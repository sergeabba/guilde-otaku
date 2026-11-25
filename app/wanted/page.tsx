"use client";

// Wanted : les avis de recherche de la Guilde, façon One Piece. La prime de chaque
// membre est calculée à partir de sa fiche (lib/wanted.ts) et le calcul est expliqué
// en tête de page ; chaque affiche détaille ses propres lignes.
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useBackClose } from "../hooks/useBackClose";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Maximize2, Pause, Play, Search, Share2, Sword, User, Volume2, VolumeX, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import { fetchMembers } from "../utils/dataAdapter";
import { normalize } from "../utils/text";
import { useShare } from "../hooks/useShare";
import type { Member, Rank } from "../../data/members";
import { rankAccents } from "../config/ranks";
import { optimizedSrc } from "../../lib/img";
import { bounty, BOUNTY_RULES, formatBounty, RANK_BOUNTY, sayBounty } from "../../lib/wanted";
import { saveImage, saveMessage } from "../../lib/save-image";
import { fileSlug } from "../../lib/share";
import "./wanted.css";
import { rescuedByFallback } from "../../lib/local-image";

type ViewMode = "real" | "anime";
type SortMode = "prime-desc" | "registre" | "prime-asc";

/** « Maxime "MX Geek" » devient « MAXIME·MX·GEEK » : mots reliés par des points, comme sur les affiches. */
const posterName = (name: string) => name.replace(/["“”«»]/g, " ").trim().split(/\s+/).join("·");
const primeOf = (m: Member) => bounty(m).total;

/** Le symbole du berry : un B barré de deux traits verticaux. */
function Berry({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 22 30" aria-hidden="true" focusable="false">
      <text x="11" y="25" textAnchor="middle" fontFamily="'Times New Roman', Times, serif" fontWeight="900" fontSize="28" fill="currentColor">B</text>
      <path d="M8.2 1.5v27M13.4 1.5v27" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/** Volute décorative de part et d'autre de « DEAD OR ALIVE ». */
function Scroll({ flip }: { flip?: boolean }) {
  return (
    <svg className={`wp-scroll${flip ? " is-flip" : ""}`} viewBox="0 0 40 60" aria-hidden="true" focusable="false">
      <path d="M30 4c-14 0-22 8-22 18 0 7 5 11 10 11 4 0 7-3 7-7 0-3-2-5-5-5M30 56c-14 0-22-8-22-18" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M8 30h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Poster({ member, viewMode, eager = false }: { member: Member; viewMode: ViewMode; eager?: boolean }) {
  const src = viewMode === "anime" ? member.animeChar : member.photo;
  const [failed, setFailed] = useState<string | null>(null);
  const name = posterName(member.name);
  return (
    <span className="wp">
      <span className="wp-paper">
        <span className="wp-title" aria-hidden="true">WANTED</span>
        <span className="wp-photo">
          {src && failed !== src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} className="is-swap" src={optimizedSrc(src, eager ? 828 : 384)} alt="" loading={eager ? "eager" : "lazy"} decoding="async" onError={(e) => { if (!rescuedByFallback(e.currentTarget)) setFailed(src); }} />
          ) : (
            <span className="wp-photo-empty" aria-hidden="true">?</span>
          )}
        </span>
        <span className="wp-doa" aria-hidden="true"><Scroll /><span>DEAD OR ALIVE</span><Scroll flip /></span>
        <span className={`wp-name${name.length > 14 ? " is-long" : ""}${name.length > 20 ? " is-xlong" : ""}`}>{name}</span>
        <span className="wp-prime"><Berry className="wp-berry" /><span>{formatBounty(primeOf(member))}</span></span>
        <span className="wp-foot" aria-hidden="true">
          <small>KONO SOSHIKI NI KANSURU JOHO WA GUIRUDO OTAKU NO HONBU MADE. SHOKIN WA SHIBO NO BAAI MO SHIHARAWARERU.</small>
          <b>MARINE</b>
        </span>
      </span>
    </span>
  );
}

/** Dessine l'affiche sur un canvas pour la proposer en PNG (même mise en page que la page). */
async function renderPosterPng(member: Member, viewMode: ViewMode): Promise<Blob> {
  // Dessinée en 2K (2000 × 3000) : mêmes coordonnées, échelle 2.
  const W = 1000, H = 1500, SCALE = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingQuality = "high";
  const serif = "'Times New Roman', Times, serif";
  const ink = "#4a2f1e";

  // Papier crème, bords vieillis
  ctx.fillStyle = "#efe0bf"; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(120,80,40,0)"); v.addColorStop(1, "rgba(120,80,40,0.35)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.save(); ctx.translate(W / 2, 250); ctx.scale(1, 1.35); ctx.font = `900 218px ${serif}`; ctx.fillText("WANTED", 0, 0); ctx.restore();

  const px = 86, py = 300, pw = W - 172, ph = 640;
  ctx.fillStyle = "#3b2a1c"; ctx.fillRect(px, py, pw, ph);
  const src = viewMode === "anime" ? member.animeChar : member.photo;
  if (src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("image")); img.src = src; });
    const scale = Math.max(pw / img.width, ph / img.height);
    const sw = pw / scale, sh = ph / scale;
    ctx.filter = "sepia(0.35) saturate(0.85) contrast(1.05)";
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) * 0.15, sw, sh, px, py, pw, ph);
    ctx.filter = "none";
  }
  ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.strokeRect(px, py, pw, ph);

  ctx.fillStyle = ink;
  ctx.font = `700 64px ${serif}`;
  ctx.fillText("DEAD  OR  ALIVE", W / 2, 1030);
  const name = posterName(member.name).toUpperCase();
  let size = 130;
  ctx.font = `900 ${size}px ${serif}`;
  while (ctx.measureText(name).width > pw && size > 50) { size -= 4; ctx.font = `900 ${size}px ${serif}`; }
  ctx.save(); ctx.translate(W / 2, 1180); ctx.scale(1, 1.3); ctx.fillText(name, 0, 0); ctx.restore();

  // Berry dessiné : B + deux traits
  const amount = formatBounty(primeOf(member)).split("").join(" ");
  ctx.font = `700 72px ${serif}`;
  const tw = ctx.measureText(amount).width;
  const bx = W / 2 - tw / 2 - 38;
  ctx.font = `900 84px ${serif}`; ctx.fillText("B", bx, 1300);
  ctx.fillRect(bx - 12, 1228, 5, 84); ctx.fillRect(bx + 6, 1228, 5, 84);
  ctx.font = `700 72px ${serif}`; ctx.textAlign = "left"; ctx.fillText(amount, bx + 62, 1296);

  ctx.textAlign = "left"; ctx.font = `16px ${serif}`;
  ctx.fillText("GUILDE OTAKU · guilde-otaku.vercel.app/wanted", px, 1420);
  ctx.textAlign = "right"; ctx.font = `900 74px ${serif}`; ctx.fillText("MARINE", px + pw, 1430);

  // JPEG haute qualité : 5 fois plus léger qu'un PNG, donc prêt plus vite.
  return new Promise((res, rej) => canvas.toBlob((b) => { canvas.width = canvas.height = 0; if (b) res(b); else rej(new Error("blob")); }, "image/jpeg", 0.93));
}

/** Le détail d'une prime, ligne par ligne, comme un reçu. */
function Receipt({ member }: { member: Member }) {
  const { total, lines } = bounty(member);
  return (
    <dl className="wt-receipt">
      {lines.map((l) => (
        <div key={l.key} className={l.amount ? "" : "is-zero"}>
          <dt>{l.label}<small>{l.detail}</small></dt>
          <dd>{l.amount ? `+ ${l.amount.toLocaleString("fr-FR")}` : "0"}</dd>
        </div>
      ))}
      <div className="is-total">
        <dt>Prime totale</dt>
        <dd><Berry className="wt-berry" /> {formatBounty(total)}</dd>
      </div>
    </dl>
  );
}

const RANK_ORDER = (Object.keys(RANK_BOUNTY) as Rank[]).sort((a, b) => RANK_BOUNTY[b] - RANK_BOUNTY[a]);

export default function WantedPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("anime");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortMode>("prime-desc");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  useBackClose(lightbox, () => setLightbox(false));
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
      // Lien profond : /wanted?avis=12 ; sinon, la tête la plus chère.
      const wanted = Number(new URLSearchParams(window.location.search).get("avis"));
      const top = [...list].sort((a, b) => primeOf(b) - primeOf(a))[0];
      setCurrentId(list.find((m) => m.id === wanted)?.id ?? top?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => [...(members ?? [])].sort((a, b) => primeOf(b) - primeOf(a)), [members]);
  const crewTotal = useMemo(() => ranked.reduce((s, m) => s + primeOf(m), 0), [ranked]);

  const list = useMemo(() => {
    const q = normalize(searchTerm.trim());
    const base = (members ?? []).filter((m) => !q || normalize(m.name).includes(q) || normalize(m.rank).includes(q));
    if (sort === "registre") return base;
    return [...base].sort((a, b) => (sort === "prime-desc" ? primeOf(b) - primeOf(a) : primeOf(a) - primeOf(b)));
  }, [members, searchTerm, sort]);

  const index = Math.max(0, list.findIndex((m) => m.id === currentId));
  const member = list[index];
  const rankOf = (m: Member) => ranked.findIndex((x) => x.id === m.id) + 1;

  useEffect(() => {
    if (list.length && !list.some((m) => m.id === currentId)) setCurrentId(list[0].id);
  }, [list, currentId]);

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

  // Affiches préparées à l'avance (4 au plus en mémoire) : sur iPhone, le partage
  // (« Enregistrer l'image ») doit s'ouvrir juste après l'appui.
  const posterCache = useRef(new Map<string, Promise<Blob>>());
  const posterFor = useCallback((m: Member, v: ViewMode) => {
    const k = `${m.id}-${v}`, cache = posterCache.current;
    let job = cache.get(k);
    if (!job) {
      job = renderPosterPng(m, v);
      job.catch(() => cache.delete(k));
      cache.set(k, job);
      while (cache.size > 4) cache.delete(cache.keys().next().value!);
    }
    return job;
  }, []);
  // L'avis affiché depuis un instant : on prépare son affiche en arrière-plan.
  useEffect(() => {
    if (!member) return;
    const t = window.setTimeout(() => { void posterFor(member, viewMode).catch(() => {}); }, 900);
    return () => window.clearTimeout(t);
  }, [member, viewMode, posterFor]);
  const download = async () => {
    if (!member || downloading) return;
    setDownloading(true);
    try {
      const r = await saveImage(await posterFor(member, viewMode), `wanted-${fileSlug(member.name)}.jpg`);
      if (r !== "cancelled") notify(saveMessage(r, "Affiche"));
    } catch {
      notify("Portrait protégé : téléchargement impossible");
    } finally {
      setDownloading(false);
    }
  };

  const loading = members === null;
  const top3 = ranked.slice(0, 3);
  const example = ranked[0];

  return (
    <div className="gk-page tone-dark wt-page">
      <audio ref={audioRef} loop preload="none">
        {/* AAC 128 kb/s (1,8 Mo) ; l'original MP3 en secours. */}
        <source src="/_opt/audio-wanted.m4a" type="audio/mp4" />
        <source src="/wanted.mp3" type="audio/mpeg" />
      </audio>
      <GuildeHeader activePage="wanted" accentColor="#e2b33c" bgColor="#06121c" tone="dark" />

      {/* ── La mer, la nuit : titre et les trois têtes les plus chères ── */}
      <section className="wt-sea" aria-labelledby="wt-title">
        <div className="wt-sky" aria-hidden="true" />
        <div className="gk-wrap wt-hero">
          <div className="wt-hero-text">
            <p className="gk-chapter"><b>03</b><span>TEHAISHO · AVIS DE RECHERCHE</span></p>
            <h1 id="wt-title" className="wt-title">WANTED</h1>
            <p className="wt-doa"><Scroll /><span>DEAD OR ALIVE</span><Scroll flip /></p>
            <p className="wt-lede">Chaque membre de la Guilde a sa tête mise à prix. Les primes ne tombent pas du ciel : elles se calculent à partir de la fiche de chacun, et le détail est juste en dessous.</p>
            {!loading && ranked.length > 0 && (
              <dl className="wt-stats">
                <div><dt>Prime de l&apos;équipage</dt><dd><Berry className="wt-berry" /> {sayBounty(crewTotal)}</dd></div>
                <div><dt>Avis placardés</dt><dd>{ranked.length}</dd></div>
                <div><dt>Tête la plus chère</dt><dd>{ranked[0].name}</dd></div>
              </dl>
            )}
          </div>
          <div className="wt-fan" aria-label="Les trois primes les plus élevées">
            {top3.map((m, i) => (
              <button key={m.id} type="button" className={`wt-fan-item is-${i + 1}`} onClick={() => pick(m.id)} aria-label={`${i + 1}re prime : ${m.name}, ${sayBounty(primeOf(m))} de berrys`}>
                <Poster member={m} viewMode={viewMode} eager={i === 0} />
                <span className="wt-fan-rank" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
            {loading && <div className="gk-skel wt-fan-skel" />}
          </div>
        </div>
        <div className="wt-waves" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <main className="gk-wrap wt-main">
        {/* ── Comment la prime est fixée ── */}
        <section className="wt-rules" aria-labelledby="wt-rules-title" data-gk-motion="reveal">
          <div className="wt-rules-head">
            <p className="wt-rules-kicker">Kenshōkin · Le barème des primes</p>
            <h2 id="wt-rules-title">Comment se calcule une prime ?</h2>
            <p>La prime additionne cinq lignes, toutes tirées de la fiche du membre. Quand la fiche change (nouveau grade, distinction, favoris ajoutés…), l&apos;affiche se met à jour toute seule.</p>
          </div>
          <ol className="wt-rules-list">
            <li>
              <span className="wt-rules-no">1</span>
              <div>
                <h3>Le grade</h3>
                <p>La base de la prime. Plus le grade est haut, plus la tête est chère.</p>
                <ul className="wt-grades">
                  {RANK_ORDER.map((r) => (
                    <li key={r} style={{ "--rk": rankAccents[r] } as React.CSSProperties}><span>{r}</span><b>{sayBounty(RANK_BOUNTY[r])}</b></li>
                  ))}
                </ul>
              </div>
            </li>
            {(Object.keys(BOUNTY_RULES) as (keyof typeof BOUNTY_RULES)[]).map((k, i) => (
              <li key={k}>
                <span className="wt-rules-no">{i + 2}</span>
                <div><h3>{BOUNTY_RULES[k].label}</h3><p>{BOUNTY_RULES[k].text}</p></div>
              </li>
            ))}
          </ol>
          {example && (
            <div className="wt-example">
              <p className="wt-example-title">Exemple : la prime de {example.name}</p>
              <Receipt member={example} />
            </div>
          )}
        </section>

        {/* ── Recherche et réglages ── */}
        <div className="wt-bar" id="avis">
          <div className="gk-field">
            <Search size={18} aria-hidden="true" />
            <input type="search" className="gk-input" placeholder="Chercher un nom ou un grade" aria-label="Chercher une affiche par nom ou par grade" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button type="button" className="gk-clear no-min" onClick={() => setSearchTerm("")} aria-label="Effacer la recherche"><X size={17} aria-hidden="true" /></button>
            )}
          </div>
          <select className="wt-select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Trier les affiches">
            <option value="prime-desc">Plus grosses primes</option>
            <option value="prime-asc">Plus petites primes</option>
            <option value="registre">Ordre du registre</option>
          </select>
          <span />
          <div className="wt-bar-right">
            <div className="gk-switch" role="group" aria-label="Type de portrait">
              <button type="button" aria-pressed={viewMode === "anime"} onClick={() => setViewMode("anime")}><Sword size={15} aria-hidden="true" /> Anime</button>
              <button type="button" aria-pressed={viewMode === "real"} onClick={() => setViewMode("real")}><User size={15} aria-hidden="true" /> Réel</button>
            </div>
            <button type="button" className="gk-icon-btn" aria-pressed={isAutoPlay} onClick={() => setIsAutoPlay((v) => !v)} aria-label={isAutoPlay ? "Arrêter le diaporama" : "Lancer le diaporama"} title={isAutoPlay ? "Arrêter le diaporama" : "Lancer le diaporama"}>
              {isAutoPlay ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
            </button>
            <button type="button" className="gk-icon-btn" aria-pressed={isPlaying} onClick={toggleSound} aria-label={isPlaying ? "Couper la musique" : "Lancer la musique"} title={isPlaying ? "Couper la musique" : "Lancer la musique"}>
              {isPlaying ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* ── L'affiche en grand et son reçu ── */}
        <div ref={stageRef} style={{ scrollMarginTop: 110 }}>
          {loading ? (
            <div className="wt-stage" role="status" aria-label="Chargement des affiches">
              <div className="wt-poster-slot"><div className="gk-skel" style={{ width: "min(400px, 80%)", aspectRatio: "2 / 3" }} /></div>
              <div><div className="gk-skel" style={{ height: 70, width: "80%" }} /><div className="gk-skel" style={{ height: 220, marginTop: 20 }} /></div>
            </div>
          ) : !member ? (
            <div className="gk-empty" style={{ marginTop: 32 }}>
              <div className="gk-empty-glyph" aria-hidden="true">Tōbō</div>
              <h3>Ce pirate court toujours</h3>
              <p>{members.length === 0 ? "Les affiches n'ont pas pu être chargées. Recharge la page dans un instant." : `Aucune affiche ne correspond à « ${searchTerm} ».`}</p>
              {searchTerm && <button type="button" className="gk-btn" onClick={() => setSearchTerm("")}>Revoir toutes les affiches</button>}
            </div>
          ) : (
            <div className="wt-stage">
              <div className="wt-poster-slot">
                <button type="button" className="wt-arrow" onClick={() => step(-1)} aria-label="Affiche précédente"><ChevronLeft size={26} aria-hidden="true" /></button>
                <div className="wt-poster-wrap">
                  <button key={member.id} type="button" className="wt-main-poster" onClick={() => setLightbox(true)} aria-label={`Agrandir l'affiche de ${member.name}`} style={{ "--tilt": `${((member.id % 4) - 1.5) * 1.1}deg` } as React.CSSProperties}>
                    <Poster member={member} viewMode={viewMode} eager />
                  </button>
                </div>
                <button type="button" className="wt-arrow" onClick={() => step(1)} aria-label="Affiche suivante"><ChevronRight size={26} aria-hidden="true" /></button>
              </div>

              <div className="wt-notice" aria-live="polite">
                <p className="wt-counter">Avis {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")} · {rankOf(member)}<sup>{rankOf(member) === 1 ? "re" : "e"}</sup> prime de la Guilde</p>
                <h2 style={{ "--rk": rankAccents[member.rank] } as React.CSSProperties}>{member.name}</h2>
                <p className="wt-grade" style={{ "--rk": rankAccents[member.rank] } as React.CSSProperties}>{member.rank}{member.badge ? ` · ${member.badge}` : ""}</p>
                <p className="wt-say">Soit {sayBounty(primeOf(member))} de berrys.</p>
                <Receipt member={member} />
                <div className="wt-actions">
                  <button type="button" className="gk-btn" onClick={() => setLightbox(true)}><Maximize2 size={16} aria-hidden="true" /> Agrandir</button>
                  <button type="button" className="gk-btn gk-btn--ghost" onClick={() => share({ title: `WANTED : ${member.name}`, text: `${member.name}, recherché mort ou vif. Prime : ${sayBounty(primeOf(member))} de berrys.`, url: `/wanted?avis=${member.id}` })}><Share2 size={16} aria-hidden="true" /> Partager</button>
                  <button type="button" className="gk-btn gk-btn--ghost" onClick={download} aria-busy={downloading}><Download size={16} aria-hidden="true" /> {downloading ? "Préparation" : "Télécharger"}</button>
                  <a href={`/membres/${member.id}`} className="gk-btn gk-btn--ghost">Voir la fiche</a>
                </div>
                <p className="wt-note">Flèches gauche et droite pour feuilleter les avis. Une ligne à 0 se remplit quand la fiche est complétée.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Le tableau d'affichage ── */}
        {!loading && list.length > 0 && (
          <section className="wt-board" data-gk-motion="reveal" aria-labelledby="wt-wall-title">
            <div className="wt-board-head">
              <h2 id="wt-wall-title">Le tableau d&apos;affichage</h2>
              <span className="wt-board-count">{list.length} {list.length > 1 ? "avis placardés" : "avis placardé"}</span>
            </div>
            <div className="wt-wall">
              {list.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="wt-wall-item"
                  onClick={() => pick(m.id)}
                  aria-current={m.id === member?.id ? "true" : undefined}
                  aria-label={`Afficher l'avis de ${m.name}, prime de ${sayBounty(primeOf(m))} de berrys`}
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
        <div ref={lightboxRef} className="wt-lightbox tone-dark" role="dialog" aria-modal="true" aria-label={`Affiche de ${member.name}`} onClick={(e) => { if (e.target === e.currentTarget) setLightbox(false); }}>
          <button type="button" className="gk-icon-btn wt-lightbox-close" onClick={() => setLightbox(false)} aria-label="Fermer l'affiche"><X size={20} aria-hidden="true" /></button>
          <button type="button" className="wt-arrow" onClick={() => step(-1)} aria-label="Affiche précédente"><ChevronLeft size={26} aria-hidden="true" /></button>
          <div key={member.id} className="wt-lightbox-poster" onClick={(e) => e.stopPropagation()}><Poster member={member} viewMode={viewMode} eager /></div>
          <button type="button" className="wt-arrow" onClick={() => step(1)} aria-label="Affiche suivante"><ChevronRight size={26} aria-hidden="true" /></button>
        </div>,
        document.body
      )}
      <Toast />
    </div>
  );
}
