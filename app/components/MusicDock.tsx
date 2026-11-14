"use client";

// Lecteur de musique flottant, commun à tout le site.
// - YouTube : morceau complet pour tout le monde, sans compte (publicités possibles).
//   Le lecteur officiel reste visible (au moins 200 × 200 px) pendant la lecture,
//   comme l'exigent les règles d'intégration de YouTube : « Réduire » met en pause.
// - Spotify : lecteur officiel (extrait de 30 s sans compte Spotify).
// Rien ne démarre sans un appui du visiteur. La lecture continue d'une page à
// l'autre du site (le lecteur vit dans la mise en page racine).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Music, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { MemberTrack } from "../../lib/member-extras";
import { PROVIDER_LABEL, PROVIDER_LIMIT, isPlayable, openUrl } from "../../lib/music";

export interface DockTrack extends MemberTrack {
  /** Membre dont c'est la playlist (affiché dans le lecteur). */
  owner?: string;
}

interface DockApi {
  current: DockTrack | null;
  playing: boolean;
  /** Lance une file de morceaux à partir de l'index donné. */
  play: (queue: DockTrack[], index?: number) => void;
  toggle: () => void;
  /** Met en pause et réduit le lecteur (ex. pendant un combat plein écran). */
  minimize: () => void;
  isCurrent: (t: MemberTrack) => boolean;
}

const Ctx = createContext<DockApi | null>(null);
export const useMusicDock = () => useContext(Ctx);

// ─── API IFrame YouTube (types minimaux) ─────────────────────────────────────
interface YTPlayer { loadVideoById(id: string): void; playVideo(): void; pauseVideo(): void; destroy(): void }
interface YTNamespace { Player: new (el: HTMLElement, o: Record<string, unknown>) => YTPlayer }
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

let ytReady: Promise<YTNamespace> | null = null;
function loadYouTube(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); if (window.YT) resolve(window.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => { ytReady = null; reject(new Error("YouTube injoignable")); };
    document.head.appendChild(s);
  });
  return ytReady;
}

const key = (t: MemberTrack) => `${t.provider}:${t.id}`;

export function MusicDockProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<DockTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const playerKind = useRef<"youtube" | null>(null);
  const current = queue[index] ?? null;
  const indexRef = useRef(0);
  const queueRef = useRef<DockTrack[]>([]);
  useEffect(() => { indexRef.current = index; queueRef.current = queue; }, [index, queue]);

  const step = useCallback((dir: 1 | -1) => {
    const q = queueRef.current;
    if (q.length < 2) return;
    setError(null);
    setIndex((i) => (i + dir + q.length) % q.length);
  }, []);

  // Charge ou change la vidéo YouTube quand le morceau courant change.
  useEffect(() => {
    if (!current || current.provider !== "youtube" || minimized) return;
    let cancelled = false;
    loadYouTube().then((YT) => {
      if (cancelled || !host.current) return;
      if (player.current && playerKind.current === "youtube") { player.current.loadVideoById(current.id); return; }
      const el = document.createElement("div");
      host.current.replaceChildren(el);
      playerKind.current = "youtube";
      player.current = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        videoId: current.id,
        width: "100%", height: "100%",
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setPlaying(true);
            if (e.data === 2) setPlaying(false);
            if (e.data === 0) { setPlaying(false); if (queueRef.current.length > 1) step(1); }
          },
          onError: (e: { data: number }) => {
            setPlaying(false);
            setError(e.data === 101 || e.data === 150 ? "Cette vidéo ne peut pas être lue ici : ouvre-la sur YouTube." : "Lecture impossible pour le moment.");
          },
        },
      });
    }).catch(() => setError("YouTube est injoignable : ouvre le morceau dans un nouvel onglet."));
    return () => { cancelled = true; };
  }, [current, minimized, step]);

  // Le lecteur YouTube est détruit dès qu'on passe à Spotify, qu'on réduit ou qu'on ferme.
  const dropYouTube = useCallback(() => {
    try { player.current?.destroy(); } catch { /* déjà détruit */ }
    player.current = null; playerKind.current = null;
    host.current?.replaceChildren();
  }, []);
  useEffect(() => { if (current?.provider !== "youtube") dropYouTube(); }, [current, dropYouTube]);

  const play = useCallback((q: DockTrack[], i = 0) => {
    const list = q.filter(isPlayable);
    if (!list.length) return;
    const start = Math.max(0, list.findIndex((t) => key(t) === key(q[i] ?? list[0])));
    setError(null); setMinimized(false); setQueue(list); setIndex(start);
    setPlaying(list[start].provider === "spotify");
  }, []);

  const toggle = useCallback(() => {
    if (!current) return;
    if (minimized) { setMinimized(false); return; } // réouvre : la vidéo reprend
    if (current.provider !== "youtube" || !player.current) return;
    if (playing) player.current.pauseVideo(); else player.current.playVideo();
  }, [current, minimized, playing]);

  const minimize = useCallback(() => {
    try { player.current?.pauseVideo(); } catch { /* lecteur pas prêt */ }
    dropYouTube(); setPlaying(false); setMinimized(true);
  }, [dropYouTube]);
  const close = () => { dropYouTube(); setQueue([]); setIndex(0); setPlaying(false); setMinimized(false); setError(null); };

  // Signale au reste du site qu'un lecteur occupe le bas de l'écran, avec sa hauteur :
  // la page réserve cette place en bas pour que rien ne reste caché dessous.
  const dockRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const state = !current ? "" : minimized ? "min" : "open";
    if (state) document.body.dataset.musicDock = state; else delete document.body.dataset.musicDock;
    const el = dockRef.current;
    if (!el) { document.body.style.removeProperty("--mdock-h"); return; }
    const set = () => document.body.style.setProperty("--mdock-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [current, minimized]);

  const api = useMemo<DockApi>(() => ({
    current, playing: playing && !minimized, play, toggle, minimize,
    isCurrent: (t) => !!current && key(t) === key(current),
  }), [current, playing, minimized, play, toggle, minimize]);

  const label = current ? [current.title, current.artist].filter(Boolean).join(" · ") || "Morceau sans titre" : "";

  return (
    <Ctx.Provider value={api}>
      {children}
      {current && (
        <aside ref={dockRef} className={`mdock${minimized ? " is-min" : ""}`} aria-label="Lecteur de musique">
          {minimized ? (
            <button type="button" className="mdock-pill" onClick={() => setMinimized(false)} aria-label={`Reprendre ${label}`}>
              <Cover t={current} />
              <span className="mdock-pill-txt"><strong>{current.title || "Morceau sans titre"}</strong><small>En pause · reprendre</small></span>
              <Play size={18} aria-hidden="true" />
            </button>
          ) : (
            <div className={`mdock-card mdock-card--${current.provider}`}>
              <div className="mdock-head">
                <Cover t={current} />
                <div className="mdock-txt" aria-live="polite">
                  <small>{current.owner ? `Playlist de ${current.owner}` : "Ongaku"} · {index + 1}/{queue.length}</small>
                  <strong>{current.title || "Morceau sans titre"}</strong>
                  {current.artist && <span>{current.artist}</span>}
                </div>
                <button type="button" className="mdock-icon" onClick={minimize} aria-label="Réduire le lecteur (met en pause)" title="Réduire (pause)"><ChevronDown size={18} aria-hidden="true" /></button>
                <button type="button" className="mdock-icon" onClick={close} aria-label="Fermer le lecteur"><X size={18} aria-hidden="true" /></button>
              </div>
              {current.provider === "youtube" ? (
                <div className="mdock-video" ref={host} />
              ) : (
                <iframe
                  key={key(current)} className="mdock-spotify"
                  src={`https://open.spotify.com/embed/${current.id}?utm_source=generator`}
                  title={`Lecteur Spotify : ${label}`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"
                />
              )}
              {error && <p className="mdock-error" role="alert">{error}</p>}
              <div className="mdock-bar">
                <button type="button" className="mdock-icon" onClick={() => step(-1)} disabled={queue.length < 2} aria-label="Morceau précédent"><SkipBack size={18} aria-hidden="true" /></button>
                {current.provider === "youtube" && (
                  <button type="button" className="mdock-play" onClick={toggle} aria-label={playing ? "Pause" : "Lecture"}>
                    {playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
                  </button>
                )}
                <button type="button" className="mdock-icon" onClick={() => step(1)} disabled={queue.length < 2} aria-label="Morceau suivant"><SkipForward size={18} aria-hidden="true" /></button>
                <a className="mdock-link" href={openUrl(current)} target="_blank" rel="noopener noreferrer">
                  {PROVIDER_LABEL[current.provider]} <ExternalLink size={13} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
                </a>
              </div>
              {current.provider === "spotify" && <p className="mdock-note">{PROVIDER_LIMIT.spotify}</p>}
            </div>
          )}
        </aside>
      )}
    </Ctx.Provider>
  );
}

function Cover({ t }: { t: DockTrack }) {
  const [failed, setFailed] = useState(false);
  const src = t.cover ?? (t.provider === "youtube" ? `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg` : undefined);
  if (!src || failed) return <span className="mdock-cover is-empty" aria-hidden="true"><Music size={18} /></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="mdock-cover" src={src} alt="" width={44} height={44} loading="lazy" onError={() => setFailed(true)} />;
}
