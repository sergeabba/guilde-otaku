"use client";

// Le générique du jour : pochette en grand (le disque sort de la pochette pendant
// l'écoute), titre, artiste, anime, extrait de 30 s et liens vers la version complète.
// « Un autre » tire un nouveau générique au hasard.
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Pause, Play, Shuffle } from "lucide-react";
import type { AnimeSong } from "../../lib/anime-song";
import { useMusicDock } from "./MusicDock";

export default function SongOfTheDay({ initial }: { initial: AnimeSong }) {
  const [song, setSong] = useState(initial);
  const [isToday, setIsToday] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const dock = useMusicDock();

  useEffect(() => () => audio.current?.pause(), []);
  // Le lecteur global reprend la main : l'extrait s'arrête.
  useEffect(() => { if (dock?.playing) audio.current?.pause(); }, [dock?.playing]);

  async function toggle() {
    const a = audio.current;
    if (!a || !song.preview) return;
    if (playing) { a.pause(); return; }
    if (dock?.playing) dock.minimize();
    try { await a.play(); setError(null); } catch { setError("Lecture impossible sur cet appareil : ouvre la version complète."); }
  }

  async function another() {
    setLoading(true); setError(null);
    audio.current?.pause();
    try {
      const res = await fetch(`/api/anime-song?random=1&not=${song.index}`);
      const data = await res.json();
      if (!res.ok || !data.song) throw new Error();
      setSong(data.song); setIsToday(false); setProgress(0);
    } catch {
      setError("Impossible de charger un autre générique. Réessaie.");
    } finally { setLoading(false); }
  }

  const label = song.kind === "OP" ? "Opening" : "Ending";
  return (
    <section className={`sotd tone-dark${playing ? " is-playing" : ""}`} aria-labelledby="sotd-title" style={{ "--sotd-cover": song.cover ? `url(${JSON.stringify(song.cover)})` : "none" } as React.CSSProperties}>
      <div className="sotd-backdrop" aria-hidden="true" />
      <div className="gk-wrap sotd-inner">
        <div className="sotd-art">
          <div className="sotd-disc" aria-hidden="true"><span /></div>
          <div className="sotd-cover">
            {song.cover
              // eslint-disable-next-line @next/next/no-img-element
              ? <img key={song.cover} src={song.cover} alt={`Pochette de ${song.title}`} width={600} height={600} />
              : <span className="sotd-cover-empty">{label}</span>}
          </div>
        </div>

        <div className="sotd-copy">
          <span className="gk-chapter"><b>♪</b><span>{isToday ? "LE GÉNÉRIQUE DU JOUR" : "AU HASARD"}</span></span>
          <p className="sotd-anime"><span className="sotd-kind">{label}</span>{song.anime} · {song.year}</p>
          <h2 id="sotd-title" className="gk-display sotd-title" key={song.index}>{song.title}</h2>
          <p className="sotd-artist">{song.artist}</p>

          <div className="sotd-player">
            {song.preview ? (
              <>
                <button type="button" className="sotd-play" onClick={toggle} aria-label={playing ? "Mettre l'extrait en pause" : `Écouter un extrait de ${song.title}`}>
                  {playing ? <Pause size={26} aria-hidden="true" /> : <Play size={26} aria-hidden="true" />}
                </button>
                <div className="sotd-bar" role="progressbar" aria-label="Avancement de l'extrait" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                  <span style={{ transform: `scaleX(${progress})` }} />
                </div>
                <span className="sotd-time">Extrait 30 s</span>
                <audio
                  ref={audio} src={song.preview} preload="none"
                  onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                  onEnded={() => { setPlaying(false); setProgress(0); }}
                  onTimeUpdate={(e) => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }}
                />
              </>
            ) : <p className="sotd-note">Extrait indisponible pour le moment.</p>}
          </div>
          {error && <p className="sotd-note" role="alert">{error}</p>}

          <div className="sotd-links">
            <a className="gk-btn gk-btn--sm" href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" /> En entier sur YouTube</a>
            {song.appleUrl && <a className="gk-btn gk-btn--sm gk-btn--ghost" href={song.appleUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden="true" /> Apple Music</a>}
            <button type="button" className="gk-btn gk-btn--sm gk-btn--ghost" onClick={another} disabled={loading} aria-busy={loading}><Shuffle size={15} aria-hidden="true" /> {loading ? "Tirage…" : "Un autre"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
