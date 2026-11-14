"use client";

// Bande-annonce « légère » : une vignette et un bouton ; le lecteur YouTube n'est
// chargé qu'après l'appui (rien ne démarre seul, aucune requête YouTube avant).
import { useState } from "react";
import { Play } from "lucide-react";

export default function TrailerEmbed({ youtubeId, title, langLabel }: { youtubeId: string; title: string; langLabel?: string }) {
  const [on, setOn] = useState(false);
  const [thumbOk, setThumbOk] = useState(true);
  if (!/^[\w-]{11}$/.test(youtubeId)) return null;
  return (
    <div className="wk-trailer">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`}
          title={`Bande-annonce de ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className="wk-trailer-btn" onClick={() => setOn(true)} aria-label={`Lire la bande-annonce de ${title}${langLabel ? `, ${langLabel}` : ""}`}>
          {thumbOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy" decoding="async" onError={() => setThumbOk(false)} />
          )}
          <span className="wk-trailer-play" aria-hidden="true"><Play size={26} /></span>
          {langLabel && <span className="wk-trailer-lang">{langLabel}</span>}
        </button>
      )}
    </div>
  );
}
