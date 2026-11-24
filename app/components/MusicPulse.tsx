"use client";

// Le site bouge avec la musique : dès qu'un son joue (lecteur de la Guilde, générique
// du jour, extraits des jeux, vidéos), <html data-music="on"> est posé. Une onde
// d'égaliseur s'anime alors en bas de l'écran, et quelques éléments battent au rythme
// (styles dans app/styles/music-pulse.css). Rien ne bouge avec « réduire les animations ».
import { useEffect, useState } from "react";
import { useMusicDock } from "./MusicDock";
import "../styles/music-pulse.css";

const BARS = 32;

export default function MusicPulse() {
  const dock = useMusicDock();
  const [media, setMedia] = useState(false);

  // Médias de la page (balises audio et vidéo) : lecture et pause écoutées en phase de capture.
  useEffect(() => {
    const check = () => setMedia([...document.querySelectorAll("audio, video")].some((m) => !(m as HTMLMediaElement).paused && !(m as HTMLMediaElement).muted));
    const evs = ["play", "playing", "pause", "ended", "emptied", "volumechange"];
    evs.forEach((e) => document.addEventListener(e, check, true));
    return () => evs.forEach((e) => document.removeEventListener(e, check, true));
  }, []);

  const on = media || !!dock?.playing;
  useEffect(() => {
    const html = document.documentElement;
    if (on) html.dataset.music = "on"; else delete html.dataset.music;
  }, [on]);

  return (
    <div className="gk-wave" aria-hidden="true" data-on={on || undefined}>
      {Array.from({ length: BARS }, (_, i) => <i key={i} style={{ "--b": i, "--d": `${(0.42 + ((i * 37) % 23) * 0.025).toFixed(3)}s` } as React.CSSProperties} />)}
    </div>
  );
}
