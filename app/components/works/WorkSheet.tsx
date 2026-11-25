"use client";

// Mini-fiche d'une œuvre favorite : couverture, synopsis (avec crédit), bande-annonce sans
// lecture automatique, lien vers la chronique et la source. Échap et retour la ferment.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { useBackClose } from "../../hooks/useBackClose";
import { workSubtitle, workTitle, type FavoriteWork } from "../../../lib/member-extras";
import { FORMAT_LABEL } from "../../../lib/works/types";
import { trailerLangLabel } from "../../../lib/works/favorite";
import TrailerEmbed from "./TrailerEmbed";
import { useWorkTrailer } from "./TrailerReel";
import "./worksheet.css";

export default function WorkSheet({ work, chronique, onClose }: { work: FavoriteWork; chronique?: string; onClose: () => void }) {
  const trailer = useWorkTrailer(work);
  const ref = useRef<HTMLDivElement>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  useBackClose(true, onClose);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [onClose]);
  const sub = workSubtitle(work);
  return createPortal(
    <div className="sh-back tone-dark" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="sh-sheet pf-worksheet" role="dialog" aria-modal="true" aria-labelledby="pf-ws-title">
        <div className="sh-head">
          <span className="gk-tag">{work.kind === "ANIME" ? "Anime" : "Manga"}</span>
          <button type="button" className="gk-icon-btn" onClick={onClose} aria-label="Fermer la mini-fiche"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="pf-ws-body">
          {work.coverUrl && !coverFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.coverUrl} alt={`Couverture de ${workTitle(work)}`} width={220} height={330} style={{ viewTransitionName: "work-cover" }} onError={() => setCoverFailed(true)} />
          ) : <span className="pf-ws-nocover" aria-hidden="true">{workTitle(work).slice(0, 1)}</span>}
          <div className="pf-ws-info">
            <h2 id="pf-ws-title">{workTitle(work)}</h2>
            {sub && <p className="pf-ws-sub">{sub}</p>}
            <p className="pf-ws-meta">
              {[work.format ? FORMAT_LABEL[work.format] : work.kind === "ANIME" ? "Anime" : "Manga", work.year, ...(work.genres ?? []).slice(0, 3)].filter(Boolean).map((m) => <span key={String(m)}>{m}</span>)}
            </p>
            {work.personalNote && <p className="pf-ws-note">« {work.personalNote} »</p>}
          </div>
        </div>
        {work.synopsis && (
          <div className="pf-ws-block">
            <h3>Synopsis</h3>
            <p className="pf-ws-synopsis">{work.synopsis}</p>
            {work.synopsisSource === "source" && (work.synopsisCredit
              ? <small className="pf-ws-credit">Synopsis : <a href={work.synopsisCredit.url} target="_blank" rel="noopener noreferrer">{work.synopsisCredit.label}</a></small>
              : (work.source === "tmdb" || work.source === "mangadex") && <small className="pf-ws-credit">Synopsis : {work.source === "tmdb" ? "TMDB" : "MangaDex"}</small>)}
          </div>
        )}
        {trailer && (
          <div className="pf-ws-block">
            <h3>Bande-annonce</h3>
            <TrailerEmbed youtubeId={trailer.youtubeId} title={workTitle(work)} langLabel={trailerLangLabel(trailer.lang)} />
          </div>
        )}
        <div className="sh-actions">
          {chronique && <Link className="gk-btn" href={`/bibliotheque?chronique=${chronique}`}>Lire la chronique</Link>}
          {work.sourceUrl && (
            <a className="gk-btn gk-btn--ghost" href={work.sourceUrl} target="_blank" rel="noopener noreferrer">
              {work.source === "tmdb" ? "Voir sur TMDB" : work.source === "mangadex" ? "Voir sur MangaDex" : "Fiche complète"} <ExternalLink size={15} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

