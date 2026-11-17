"use client";

// Nostalgie : le juke-box des génériques français (Club Dorothée, Récré A2, M6 Kid…).
// Extraits de 30 s (Apple Music), une seule source à la fois, lecture enchaînée possible.
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Pause, Play, Shuffle } from "lucide-react";
import type { AnimeSong } from "../../lib/anime-song";
import { useMusicDock } from "../components/MusicDock";
import WordReveal from "../components/WordReveal";

export default function Nostalgie() {
  const ref = useRef<HTMLElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [songs, setSongs] = useState<AnimeSong[] | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chain, setChain] = useState(false);
  const [all, setAll] = useState(false);
  const dock = useMusicDock();

  // Chargé quand la section approche de l'écran.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      fetch("/api/anime-song?nostalgie=1").then((r) => r.json()).then((d) => setSongs((d.songs ?? []).filter((s: AnimeSong) => s.preview))).catch(() => setSongs([]));
    }, { rootMargin: "500px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => { const a = audio.current; if (a) { a.pause(); a.removeAttribute("src"); a.load(); } }, []);
  useEffect(() => { if (dock?.playing) audio.current?.pause(); }, [dock?.playing]);

  const start = useCallback((i: number, list = songs) => {
    const a = audio.current, s = list?.[i];
    if (!a || !s?.preview) return;
    if (dock?.playing) dock.minimize();
    if (a.getAttribute("src") !== s.preview) { a.pause(); a.removeAttribute("src"); a.load(); a.src = s.preview; }
    setCurrent(i); setProgress(0);
    void a.play().catch(() => {});
  }, [songs, dock]);

  const toggle = (i: number) => {
    const a = audio.current;
    if (current === i && a) { if (a.paused) void a.play().catch(() => {}); else a.pause(); return; }
    setChain(false); start(i);
  };
  const playAll = (shuffle: boolean) => {
    if (!songs?.length) return;
    setChain(true);
    start(shuffle ? Math.floor(Math.random() * songs.length) : 0);
  };
  const onEnded = () => {
    setPlaying(false);
    if (chain && songs && current !== null) start((current + 1) % songs.length);
  };

  return (
    <section ref={ref} className="cin-nosta" aria-labelledby="cin-nosta-title">
      <audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={onEnded}
        onTimeUpdate={(e) => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }} />
      <div className="gk-wrap cin-intro">
        <span className="gk-chapter"><b>♪</b><span>NATSUKASHII · NOSTALGIE</span></span>
        <h2 id="cin-nosta-title" className="gk-display cin-h2"><WordReveal>Les génériques <em>de notre enfance.</em></WordReveal></h2>
        <p>Bernard Minet, Ariane, Jacques Cardona… Les versions françaises d&apos;origine, celles du Club Dorothée et de Récré A2. Extraits de 30 secondes.</p>
        <div className="cin-nosta-actions">
          <button type="button" className="cin-step" onClick={() => playAll(false)} disabled={!songs?.length}><Play size={18} aria-hidden="true" /> Tout écouter</button>
          <button type="button" className="cin-step" onClick={() => playAll(true)} disabled={!songs?.length}><Shuffle size={18} aria-hidden="true" /> Au hasard</button>
        </div>
      </div>
      <ol className={`gk-wrap cin-nosta-grid${all ? " is-all" : ""}`} aria-busy={!songs}>
        {(songs ?? Array.from({ length: 6 }, () => null)).map((s, i) => {
          const on = s && current === i;
          return (
            <li key={s ? s.itunesId : `sk${i}`} className={`cin-tape${on ? " is-on" : ""}${on && playing ? " is-playing" : ""}`} style={{ "--i": i } as React.CSSProperties}>
              {s ? (
                <button type="button" onClick={() => toggle(i)} aria-label={`${on && playing ? "Mettre en pause" : "Écouter"} : ${s.anime}, ${s.artist}`}>
                  <span className="cin-tape-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.cover ? <img src={s.cover.replace("600x600", "300x300")} alt="" loading="lazy" /> : <span aria-hidden="true">♪</span>}
                    <span className="cin-tape-play" aria-hidden="true">{on && playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}</span>
                  </span>
                  <span className="cin-tape-txt">
                    <strong>{s.anime}</strong>
                    <small>{s.artist} · {s.year}</small>
                    {on && <span className="cin-tape-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>}
                  </span>
                </button>
              ) : <span className="gk-skel cin-tape-skel" />}
            </li>
          );
        })}
      </ol>
      {songs && songs.length > 6 && !all && (
        <div className="gk-wrap cin-nosta-more"><button type="button" className="cin-step" onClick={() => setAll(true)}>Voir les {songs.length} génériques</button></div>
      )}
      {current !== null && songs?.[current]?.appleUrl && (
        <p className="gk-wrap cin-credit">En entier : <a href={songs[current].appleUrl!} target="_blank" rel="noopener noreferrer">{songs[current].anime} sur Apple Music <ExternalLink size={12} aria-hidden="true" /></a></p>
      )}
    </section>
  );
}
