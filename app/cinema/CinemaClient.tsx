"use client";

// Le Cinéma Otaku : une affiche à la une, des rangées d'animes disponibles
// légalement en France, et une salle de projection (bande-annonce plein cadre,
// plateformes où regarder la série, données JustWatch via TMDB).
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, Maximize, Play, X } from "lucide-react";
import GuildeHeader from "../components/GuildeHeader";
import WordReveal from "../components/WordReveal";
import type { CinemaDetail, CinemaItem, Provider } from "../../lib/cinema";
import type { GuildCollection, GuildVideo } from "../../lib/drive";
import "./cinema.css";

type Rows = { series: CinemaItem[]; free: CinemaItem[]; films: CinemaItem[] };

type Guild = { collections: GuildCollection[]; error?: string; embedFolder?: string };

export default function CinemaClient({ rows, hero: picked = null, guild = null }: { rows: Rows | null; hero?: CinemaItem | null; guild?: Guild | null }) {
  const [open, setOpen] = useState<CinemaItem | null>(null);
  const [screening, setScreening] = useState<GuildVideo | null>(null);
  const hero = picked ?? rows?.series.find((i) => i.backdrop && i.overview) ?? rows?.series[0] ?? null;
  // ?titre=tv-123 : ouvert depuis la recherche globale, la séance démarre.
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("titre");
    if (!t || !rows) return;
    const hit = [...rows.series, ...rows.free, ...rows.films].find((i) => `${i.kind}-${i.id}` === t);
    if (hit) void Promise.resolve().then(() => setOpen(hit));
  }, [rows]);

  // Les vidéos de la Guilde passent en premier : la plus récente devient l'affiche.
  const guildVideos = (guild?.collections ?? []).flatMap((c) => c.videos);
  const latest = [...guildVideos].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0] ?? null;
  const hasGuild = !!guild && (guildVideos.length > 0 || !!guild.embedFolder);

  if (!rows && !hasGuild) {
    return (
      <div className="gk-page tone-dark cin-page">
        <GuildeHeader activePage="cinema" tone="dark" />
        <main className="gk-wrap cin-main"><p className="cin-empty" role="alert">Le Cinéma est fermé pour le moment : TMDB ne répond pas ou sa clé n&apos;est pas configurée.</p></main>
      </div>
    );
  }

  return (
    <div className="gk-page tone-dark cin-page">
      <GuildeHeader activePage="cinema" tone="dark" />
      {latest ? (
        <section className="cin-hero is-guild" style={{ "--bd": latest.thumb ? `url(${JSON.stringify(latest.thumb)})` : "none" } as React.CSSProperties}>
          <div className="gk-wrap cin-gh">
            <div className="cin-gh-text">
              <span className="gk-chapter"><b>▶</b><span>GEKIJŌ · LA SALLE DE LA GUILDE</span></span>
              <p className="cin-hero-kicker">À l&apos;affiche · {guildVideos.length} séance{guildVideos.length > 1 ? "s" : ""}</p>
              <h1 className="gk-display cin-hero-title">{latest.title}</h1>
              <p className="cin-hero-syn">{latest.description || [latest.collection, latest.createdAt ? DAY.format(new Date(latest.createdAt)) : null, duration(latest.durationMs)].filter(Boolean).join(" · ")}</p>
              <button type="button" className="cin-play" onClick={() => setScreening(latest)}><Play size={20} aria-hidden="true" /> Regarder ici</button>
            </div>
            <button type="button" className="cin-gh-screen" onClick={() => setScreening(latest)} aria-label={`Regarder ${latest.title}`}>
              {latest.thumb
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={latest.thumb} alt="" referrerPolicy="no-referrer" />
                : <span className="cin-thumb-empty">{latest.title.slice(0, 1)}</span>}
              <span className="cin-gh-play" aria-hidden="true"><Play size={34} fill="currentColor" /></span>
            </button>
          </div>
        </section>
      ) : !hasGuild && hero && (
        <section className="cin-hero" style={{ "--bd": hero.backdrop ? `url(${JSON.stringify(hero.backdrop)})` : "none" } as React.CSSProperties}>
          <div className="gk-wrap cin-hero-inner">
            <span className="gk-chapter"><b>▶</b><span>GEKIJŌ · LE CINÉMA OTAKU</span></span>
            <p className="cin-hero-kicker">À l&apos;affiche ce soir</p>
            <h1 className="gk-display cin-hero-title">{hero.title}</h1>
            {hero.overview && <p className="cin-hero-syn">{hero.overview.length > 260 ? `${hero.overview.slice(0, hero.overview.lastIndexOf(" ", 258))}…` : hero.overview}</p>}
            <button type="button" className="cin-play" onClick={() => setOpen(hero)}><Play size={20} aria-hidden="true" /> Bande-annonce et où regarder</button>
          </div>
        </section>
      )}
      <main className="cin-main">
        {guild && <GuildVideos guild={guild} onPlay={setScreening} />}
        {rows && <>
        <div className="gk-wrap cin-intro">
          <h2 className="gk-display cin-h2"><WordReveal>Ce soir, <em>on regarde quoi ?</em></WordReveal></h2>
          <p>Des animes japonais disponibles légalement en France. Choisis une affiche : bande-annonce en grand, puis les plateformes où regarder la série.</p>
        </div>
        <Row title="Les séries du moment" sub="Incluses dans un abonnement" items={rows.series} onOpen={setOpen} />
        <Row title="Gratuit et légal" sub="Avec publicités, sans abonnement" items={rows.free} onOpen={setOpen} />
        <Row title="Films d'animation" sub="En streaming en France" items={rows.films} onOpen={setOpen} />
        <p className="gk-wrap cin-credit">Disponibilités en France : JustWatch, via TMDB. Ce site utilise l&apos;API TMDB mais n&apos;est ni approuvé ni certifié par TMDB.</p>
        </>}
      </main>
      {open && <Theater item={open} onClose={() => setOpen(null)} />}
      {screening && <GuildTheater video={screening} playlist={guildVideos} onPick={setScreening} onClose={() => setScreening(null)} />}
    </div>
  );
}

function Row({ title, sub, items, onOpen }: { title: string; sub: string; items: CinemaItem[]; onOpen: (i: CinemaItem) => void }) {
  if (!items.length) return null;
  return (
    <section className="cin-row" aria-label={title}>
      <div className="gk-wrap cin-row-head"><h3>{title}</h3><small>{sub}</small></div>
      <ul className="cin-strip">
        {items.map((i, n) => (
          <li key={`${i.kind}-${i.id}`} style={{ "--n": n } as React.CSSProperties}>
            <button type="button" className="cin-card" onClick={() => onOpen(i)} aria-label={`${i.title}${i.year ? `, ${i.year}` : ""} : bande-annonce et plateformes`}>
              <span className="cin-poster">{i.poster && <Image src={i.poster} alt="" fill sizes="(max-width: 600px) 40vw, 200px" />}<span className="cin-poster-play" aria-hidden="true"><Play size={22} /></span></span>
              <span className="cin-card-title">{i.title}</span>
              <span className="cin-card-meta">{[i.year, i.rating ? `★ ${i.rating}` : null].filter(Boolean).join(" · ")}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Logos({ label, list, link }: { label: string; list: Provider[]; link: string | null }) {
  if (!list.length) return null;
  return (
    <div className="cin-prov">
      <p>{label}</p>
      <ul>
        {list.slice(0, 8).map((p) => (
          <li key={p.id}>
            <a href={link ?? "#"} target="_blank" rel="noopener noreferrer" title={`${p.name} : voir l'offre`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo} alt={p.name} width={46} height={46} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Theater({ item, onClose }: { item: CinemaItem; onClose: () => void }) {
  const [detail, setDetail] = useState<CinemaDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/cinema?kind=${item.kind}&id=${item.id}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error); return d.detail as CinemaDetail; })
      .then((d) => { if (alive) setDetail(d); })
      .catch((e) => { if (alive) setError(e instanceof Error && e.message ? e.message : "Chargement impossible."); });
    return () => { alive = false; };
  }, [item]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [close]);

  const nothing = detail && !detail.included.length && !detail.free.length && !detail.rent.length;
  return (
    <div className="cin-theater" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={ref} tabIndex={-1} className="cin-room" role="dialog" aria-modal="true" aria-labelledby="cin-room-title">
        <button type="button" className="cin-close" onClick={close} aria-label="Quitter la salle"><X size={22} aria-hidden="true" /></button>
        <div className="cin-screen">
          {detail?.trailer ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${detail.trailer.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`Bande-annonce de ${item.title}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            />
          ) : (
            <div className="cin-screen-empty" style={{ backgroundImage: item.backdrop ? `url(${JSON.stringify(item.backdrop)})` : undefined }}>
              <span>{error ? error : detail ? "Pas de bande-annonce disponible." : "Chargement de la séance…"}</span>
            </div>
          )}
        </div>
        <div className="cin-room-info">
          <div>
            <h2 id="cin-room-title" className="gk-display">{item.title}</h2>
            <p className="cin-room-meta">{[item.kind === "movie" ? "Film" : "Série", item.year, item.rating ? `★ ${item.rating} / 10` : null, detail?.trailer ? `Bande-annonce ${detail.trailer.lang === "fr" ? "en français" : "en VO"}` : null].filter(Boolean).join(" · ")}</p>
            <p className="cin-room-syn">{item.overview ?? "Pas de synopsis en français pour ce titre."}</p>
          </div>
          <div className="cin-room-where">
            <p className="cin-where-title">Où regarder en France</p>
            {!detail && !error && <p className="cin-muted">Recherche des plateformes…</p>}
            {detail && (
              <>
                <Logos label="Inclus dans l'abonnement" list={detail.included} link={detail.link} />
                <Logos label="Gratuit (avec publicités)" list={detail.free} link={detail.link} />
                <Logos label="Location ou achat" list={detail.rent} link={detail.link} />
                {nothing && <p className="cin-muted">Aucune plateforme française recensée pour l&apos;instant.</p>}
                {detail.link && <a className="gk-btn gk-btn--sm" href={detail.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" /> Toutes les offres</a>}
                <p className="cin-muted cin-jw">Données JustWatch</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const duration = (ms: number | null) => {
  if (!ms) return null;
  const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};
const DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Couleurs des tickets : une par séance, en boucle (chaque ticket a sa teinte).
const TICKET_COLORS = ["#e8412c", "#c9a84c", "#3b82f6", "#22c55e", "#a855f7", "#f472b6", "#f97316", "#14b8a6"];

/** Les vidéos de la Guilde : des tickets de cinéma, une section par collection (sous-dossier Drive). */
function GuildVideos({ guild, onPlay }: { guild: Guild; onPlay: (v: GuildVideo) => void }) {
  let n = 0;
  const many = guild.collections.length > 1;
  return (
    <section className="cin-guild" aria-labelledby="cin-guild-title">
      <div className="gk-wrap cin-intro">
        <span className="gk-chapter"><b>✦</b><span>NOS SÉANCES</span></span>
        <h2 id="cin-guild-title" className="gk-display cin-h2"><WordReveal>Les vidéos <em>de la Guilde.</em></WordReveal></h2>
        <p>Nos soirées, nos tournois, nos délires. Prends ton ticket : la vidéo se lance ici, en grand.</p>
      </div>
      {guild.error && <p className="gk-wrap cin-muted" role="alert">{guild.error}</p>}
      {!guild.error && !guild.collections.length && <p className="gk-wrap cin-muted">Aucune vidéo pour l&apos;instant : dépose-les dans le dossier Google Drive du Cinéma.</p>}
      {guild.collections.map((c) => (
        <section key={c.name} className="gk-wrap cin-tickets-block" aria-label={c.name}>
          {many && <div className="cin-row-head"><h3>{c.name}</h3><small>{c.videos.length} vidéo{c.videos.length > 1 ? "s" : ""}</small></div>}
          <ol className="cin-tickets">
            {c.videos.map((v) => {
              const k = n++;
              return (
                <li key={v.id} style={{ "--tk": TICKET_COLORS[k % TICKET_COLORS.length], "--i": k } as React.CSSProperties}>
                  <button type="button" className="cin-ticket" onClick={() => onPlay(v)} aria-label={`Regarder ${v.title}`}>
                    <span className="cin-ticket-shot">
                      {v.thumb
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={v.thumb.replace(/=w\d+$/, "=w640")} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        : <span className="cin-thumb-empty">{v.title.slice(0, 1)}</span>}
                      <span className="cin-ticket-no" aria-hidden="true">N° {String(k + 1).padStart(2, "0")}</span>
                      <span className="cin-ticket-play" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
                      {duration(v.durationMs) && <span className="cin-dur">{duration(v.durationMs)}</span>}
                    </span>
                    <span className="cin-ticket-stub">
                      <span className="cin-ticket-title">{v.title}</span>
                      <span className="cin-ticket-meta">
                        <span>{[v.collection, v.createdAt ? DAY.format(new Date(v.createdAt)) : null].filter(Boolean).join(" · ")}</span>
                        <b>Entrée</b>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </section>
  );
}

/** Salle de projection : lecteur Google Drive sur le site, programme pour enchaîner les séances. */
function GuildTheater({ video, playlist, onPick, onClose }: { video: GuildVideo; playlist: GuildVideo[]; onPick: (v: GuildVideo) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => onClose(), [onClose]);
  const i = playlist.findIndex((v) => v.id === video.id);
  const screenRef = useRef<HTMLDivElement>(null);
  // Plein écran de l'écran entier (et paysage sur Android) quand le navigateur le permet.
  const [canFull] = useState(() => typeof document !== "undefined" && !!document.fullscreenEnabled);
  const fullscreen = useCallback(async () => {
    const el = screenRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      await o.lock?.("landscape").catch(() => {});
    } catch { /* refusé : le bouton plein écran du lecteur Drive reste disponible */ }
  }, []);
  const step = useCallback((d: 1 | -1) => { if (playlist.length > 1) onPick(playlist[(i + d + playlist.length) % playlist.length]); }, [i, playlist, onPick]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // Flèches : seulement quand le lecteur n'a pas le focus (il gère lui-même ses touches).
      else if (document.activeElement?.tagName !== "IFRAME" && e.key === "ArrowRight") step(1);
      else if (document.activeElement?.tagName !== "IFRAME" && e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [close, step]);
  return (
    <div className="cin-theater" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={ref} tabIndex={-1} className="cin-room" role="dialog" aria-modal="true" aria-labelledby="cin-guild-room-title">
        <div className="cin-room-top">
          <span className="cin-room-top-title">{video.title}</span>
          {canFull && <button type="button" className="cin-top-btn" onClick={fullscreen} aria-label="Plein écran"><Maximize size={18} aria-hidden="true" /><span>Plein écran</span></button>}
          <button type="button" className="cin-top-btn" onClick={close} aria-label="Quitter la salle"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="cin-screen" key={video.id} ref={screenRef}>
          <iframe src={`https://drive.google.com/file/d/${encodeURIComponent(video.id)}/preview`} title={video.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
        <div className="cin-room-info is-single">
          <div className="cin-room-now">
            <div>
              <p className="cin-room-meta">Séance {i + 1} sur {playlist.length}{video.collection ? ` · ${video.collection}` : ""}{duration(video.durationMs) ? ` · ${duration(video.durationMs)}` : ""}</p>
              <h2 id="cin-guild-room-title" className="gk-display">{video.title}</h2>
              {video.description && <p className="cin-room-syn">{video.description}</p>}
            </div>
            {playlist.length > 1 && (
              <div className="cin-room-steps">
                <button type="button" className="cin-step" onClick={() => step(-1)} aria-label="Séance précédente"><ChevronLeft size={22} aria-hidden="true" /></button>
                <button type="button" className="cin-step" onClick={() => step(1)}>Séance suivante <ChevronRight size={20} aria-hidden="true" /></button>
              </div>
            )}
          </div>
          {playlist.length > 1 && (
            <div className="cin-program">
              <p className="cin-where-title">Au programme</p>
              <ol className="cin-program-list">
                {playlist.map((v, k) => (
                  <li key={v.id}>
                    <button type="button" className="cin-program-item" aria-current={v.id === video.id ? "true" : undefined} onClick={() => onPick(v)} style={{ "--tk": TICKET_COLORS[k % TICKET_COLORS.length] } as React.CSSProperties}>
                      <span className="cin-program-shot">
                        {v.thumb
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={v.thumb.replace(/=w\d+$/, "=w320")} alt="" loading="lazy" referrerPolicy="no-referrer" />
                          : null}
                        <b>{String(k + 1).padStart(2, "0")}</b>
                      </span>
                      <span className="cin-program-title">{v.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
