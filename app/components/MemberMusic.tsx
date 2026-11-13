"use client";

import { useState } from "react";
import { ExternalLink, Music, Pause, Play, Search } from "lucide-react";
import type { MemberTrack } from "../../lib/member-extras";
import { PROVIDER_LABEL, isPlayable, openUrl, youtubeSearchUrl } from "../../lib/music";
import { useMusicDock } from "./MusicDock";

/**
 * Playlist d'un membre. Un appui sur un morceau l'ouvre dans le lecteur flottant
 * du site (YouTube complet pour tous, Spotify en extrait sans compte) ; la
 * lecture continue pendant la navigation. Les anciens liens Apple Music ne sont
 * plus lus : un lien de recherche YouTube du même titre est proposé.
 */
export default function MemberMusic({ tracks, owner, compact = false }: { tracks: MemberTrack[]; owner?: string; compact?: boolean }) {
  const dock = useMusicDock();
  const list = compact ? tracks.slice(0, 1) : tracks;
  const playable = tracks.filter(isPlayable);
  if (!list.length) return null;
  const queue = playable.map((t) => ({ ...t, owner }));

  return (
    <div className={`mpl${compact ? " is-compact" : ""}`}>
      {!compact && playable.length > 1 && dock && (
        <button type="button" className="gk-btn gk-btn--sm mpl-all" onClick={() => dock.play(queue, 0)}>
          <Play size={15} aria-hidden="true" /> Tout écouter ({playable.length})
        </button>
      )}
      <ol className="mpl-list">
        {list.map((t, i) => {
          const label = [t.title, t.artist].filter(Boolean).join(" · ") || "Morceau sans titre";
          const on = dock?.isCurrent(t) ?? false;
          const canPlay = isPlayable(t) && !!dock;
          const search = youtubeSearchUrl(t);
          return (
            <li key={`${t.provider}:${t.id}`} className={`mpl-item${on ? " is-on" : ""}${canPlay ? "" : " is-legacy"}`}>
              <span className="mpl-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <TrackCover t={t} />
              <div className="mpl-txt">
                {i === 0 && !compact && <small>Musique favorite</small>}
                <strong>{t.title || "Morceau sans titre"}</strong>
                {t.artist && <span>{t.artist}</span>}
                {!canPlay && <span className="mpl-legacy">Apple Music n&apos;est plus lu sur le site</span>}
              </div>
              <span className={`mpl-src mpl-src--${t.provider}`}>{t.provider === "spotify" ? "Spotify · extrait" : PROVIDER_LABEL[t.provider]}</span>
              <div className="mpl-actions">
                {canPlay ? (
                  <button
                    type="button" className={`mpl-play${on && dock?.playing ? " is-playing" : ""}`}
                    onClick={() => (on ? dock!.toggle() : dock!.play(queue, Math.max(0, queue.findIndex((q) => q.provider === t.provider && q.id === t.id))))}
                    aria-label={on && dock?.playing ? `Pause : ${label}` : `Écouter ${label}`}
                  >
                    {on && dock?.playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
                    {on && dock?.playing && <span className="mpl-eq" aria-hidden="true"><i /><i /><i /></span>}
                  </button>
                ) : search ? (
                  <a className="gk-btn gk-btn--ghost gk-btn--sm" href={search} target="_blank" rel="noopener noreferrer">
                    <Search size={14} aria-hidden="true" /> YouTube<span className="gk-sr"> : chercher {label} (nouvel onglet)</span>
                  </a>
                ) : null}
                {canPlay && !compact && (
                  <a className="mpl-ext" href={openUrl(t)} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${label} dans ${PROVIDER_LABEL[t.provider]} (nouvel onglet)`}>
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!compact && playable.some((t) => t.provider === "youtube") && (
        <p className="mpl-note">Lecture complète via YouTube, sans compte. Le lecteur reste en bas de l&apos;écran pendant que tu navigues.</p>
      )}
    </div>
  );
}

function TrackCover({ t }: { t: MemberTrack }) {
  const [failed, setFailed] = useState(false);
  const src = t.cover ?? (t.provider === "youtube" ? `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg` : undefined);
  // L'erreur de chargement peut survenir avant l'hydratation : on vérifie l'état à l'attache.
  const check = (el: HTMLImageElement | null) => { if (el && el.complete && el.naturalWidth === 0) setFailed(true); };
  if (!src || failed) return <span className="mpl-cover is-empty" aria-hidden="true"><Music size={18} /></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={check} className="mpl-cover" src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
