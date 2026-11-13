"use client";

import { useState } from "react";
import { ExternalLink, Music, Play, Square } from "lucide-react";
import type { MemberTrack } from "../../lib/member-extras";
import { EMBED_HEIGHT, PROVIDER_LABEL, PROVIDER_LIMIT, embedUrl, openUrl } from "../../lib/music";

/**
 * Morceaux d'un membre. Rien ne se charge ni ne se lance tant que le visiteur
 * n'a pas appuyé sur « Écouter » : le lecteur officiel (YouTube, Spotify,
 * Apple Music) n'est inséré qu'à ce moment-là. Un lien vers le service reste
 * toujours disponible.
 */
export default function MemberMusic({ tracks, compact = false }: { tracks: MemberTrack[]; compact?: boolean }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const list = compact ? tracks.slice(0, 1) : tracks;
  if (!list.length) return null;

  return (
    <ul className="pf-tracks">
      {list.map((t, i) => {
        const key = `${t.provider}:${t.id}`;
        const label = [t.title, t.artist].filter(Boolean).join(" · ") || "Morceau sans titre";
        const appleAlbum = t.provider === "apple" && !t.id.includes("?i=") && !t.id.includes("/song/");
        return (
          <li key={key} className="pf-music">
            <div className="pf-music-head">
              <Music size={18} aria-hidden="true" />
              <div className="pf-music-txt">
                {i === 0 && !compact && tracks.length > 1 && <small>Musique favorite</small>}
                <strong>{t.title || "Morceau sans titre"}</strong>
                {t.artist && <span>{t.artist}</span>}
              </div>
              <span className="pf-music-src">{PROVIDER_LABEL[t.provider]}</span>
            </div>
            {playing === key ? (
              <div className="pf-track-player">
                <iframe
                  src={embedUrl(t)}
                  title={`Lecteur ${PROVIDER_LABEL[t.provider]} : ${label}`}
                  allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={t.provider === "youtube" ? undefined : { aspectRatio: "auto", height: appleAlbum ? 450 : EMBED_HEIGHT[t.provider] }}
                />
                <p className="pf-music-note">{PROVIDER_LIMIT[t.provider]}</p>
              </div>
            ) : null}
            <div className="pf-music-actions">
              {playing === key ? (
                <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={() => setPlaying(null)}>
                  <Square size={14} aria-hidden="true" /> Fermer le lecteur
                </button>
              ) : (
                <button type="button" className="gk-btn gk-btn--sm" onClick={() => setPlaying(key)} aria-label={`Écouter ${label} sur ${PROVIDER_LABEL[t.provider]}`}>
                  <Play size={14} aria-hidden="true" /> Écouter
                </button>
              )}
              <a className="gk-btn gk-btn--ghost gk-btn--sm" href={openUrl(t)} target="_blank" rel="noopener noreferrer">
                Ouvrir dans {PROVIDER_LABEL[t.provider]} <ExternalLink size={14} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
