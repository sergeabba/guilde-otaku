"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { viewTransition, waitFor } from "../../lib/view-transition";
import { ArrowRight, Cake, Share2, X } from "lucide-react";
import type { Member } from "../../data/members";
import type { ViewMode } from "../types";
import { rankAccents, rankLogos, rankRomaji, type Rank } from "../config/ranks";
import { COUNTRIES, flagUrl } from "../config/countries";
import { onColor } from "../utils/color";
import { featuredWorks, memberAwards, objectPosition, workKey, workTitle, type FavoriteWork } from "../../lib/member-extras";
import RomajiLabel from "./RomajiLabel";
import MemberAwards from "./MemberAwards";
import MemberMusic from "./MemberMusic";
import ShareSheet from "./ShareSheet";
import "../membres/[id]/profile.css";
import "./quickview.css";

function FavRow({ label, fr, works, href }: { label: string; fr: string; works: FavoriteWork[]; href: string }) {
  if (!works.length) return null;
  const top = featuredWorks(works, 3);
  return (
    <div className="qv-fav">
      <p className="qv-h"><RomajiLabel romaji={label} fr={fr} inline /></p>
      <ul>
        {top.map((w) => (
          <li key={workKey(w)}>
            <span className="qv-cover">
              {w.coverUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={w.coverUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : null}
              <b aria-hidden="true">{w.kind === "ANIME" ? "Anime" : "Manga"}</b>
            </span>
            <span className="qv-fav-title">{workTitle(w)}</span>
          </li>
        ))}
      </ul>
      {works.length > top.length && <Link className="qv-more" href={href}>+{works.length - top.length} sur la fiche complète</Link>}
    </div>
  );
}

/**
 * Fiche de base, ouverte depuis l'annuaire : même direction visuelle que la
 * fiche complète, en version courte adaptée au téléphone.
 */
export default function MemberQuickView({ member, onClose, viewMode }: { member: Member | null; onClose: () => void; viewMode: ViewMode }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // La fiche complète est préchargée dès l'ouverture : le passage est instantané.
  useEffect(() => { if (member) router.prefetch(`/membres/${member.id}`); }, [member, router]);

  useEffect(() => {
    if (!member) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".sh-back")) onClose();
      if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), iframe")];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [member, onClose]);

  if (!member || typeof document === "undefined") return null;

  const accent = rankAccents[member.rank as Rank] ?? "#c9a84c";
  const romaji = rankRomaji[member.rank as Rank];
  const extras = member.extras ?? {};
  const awards = memberAwards(member);
  const country = COUNTRIES.find((c) => c.code === member.country);
  const full = `/membres/${member.id}`;
  const portraits = [
    { key: "real", label: "Réel", src: member.photo, pos: objectPosition(extras.photoFocus, "50% 20%") },
    { key: "anime", label: "Anime", src: member.animeChar, pos: objectPosition(extras.animeFocus, "50% 15%") },
  ].filter((p) => p.src && !errors[p.key]);
  // L'annuaire affiché en mode Anime met la version anime en premier.
  if (viewMode === "anime") portraits.reverse();
  const anime = extras.favoriteAnime ?? [];
  const manga = extras.favoriteManga ?? [];
  const music = extras.music ?? [];

  return createPortal(
    <div className="qv-back tone-dark" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} className="qv-sheet gk-page" role="dialog" aria-modal="true" aria-labelledby="qv-name"
        style={{ "--gk-accent": accent, "--pf-on": onColor(accent) } as React.CSSProperties}>
        <div className="qv-top">
          <p className="gk-chapter"><b>#{String(member.id).padStart(3, "0")}</b><span>DOSSIER</span></p>
          <div className="qv-top-actions">
            <button type="button" className="gk-icon-btn" onClick={() => setShareOpen(true)} aria-label={`Partager la fiche de ${member.name}`}><Share2 size={19} aria-hidden="true" /></button>
            <button type="button" className="gk-icon-btn" onClick={onClose} aria-label="Fermer la fiche"><X size={21} aria-hidden="true" /></button>
          </div>
        </div>

        <div className="qv-body">
          {portraits.length > 0 && (
            <div className={`pf-diptych qv-diptych${portraits.length === 1 ? " is-single" : ""}`} style={{ viewTransitionName: "member-dossier" }}>
              {portraits.map((p, i) => (
                <figure key={p.key} className="pf-panel" style={i === 0 ? { viewTransitionName: "member-portrait" } : undefined}>
                  <Image src={p.src} alt={p.key === "real" ? `${member.name}, photo` : `${member.name}, version anime`} fill priority={i === 0}
                    sizes="(max-width: 699px) 50vw, 300px" style={{ objectFit: "cover", objectPosition: p.pos }}
                    onError={() => setErrors((e) => ({ ...e, [p.key]: true }))} />
                  <figcaption className={p.key === "anime" ? "is-accent" : ""}>{p.label}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="qv-id">
            <h2 id="qv-name" className="gk-display pf-name qv-name" style={{ viewTransitionName: "member-name" }}>{member.name}</h2>
            {extras.displayNameRomaji && <p className="pf-alias" lang="ja-Latn">{extras.displayNameRomaji}</p>}
            <div className="pf-rank">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rankLogos[member.rank as Rank]} alt="" width={100} height={40} />
              <span className="pf-rank-tag">{member.rank}</span>
              {romaji && <RomajiLabel romaji={romaji} className="pf-rank-romaji" />}
            </div>
            {(country || member.birthday) && (
              <p className="qv-facts">
                {country && (
                  <span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(country.code)} alt="" width={20} height={14} /> {country.label}
                  </span>
                )}
                {member.birthday && <span><Cake size={14} aria-hidden="true" /> {member.birthday}</span>}
              </p>
            )}
            {member.bio && <p className="qv-bio">{member.bio}</p>}
          </div>

          {awards.length > 0 && (
            <section className="qv-block" aria-label="Palmarès">
              <p className="qv-h">Palmarès</p>
              <MemberAwards awards={awards} limit={3} />
              {awards.length > 3 && <Link className="qv-more" href={`${full}#pf-palmares`}>Voir les {awards.length} distinctions</Link>}
            </section>
          )}

          {(anime.length > 0 || manga.length > 0) && (
            <section className="qv-block" aria-label="Anime et mangas préférés">
              <FavRow label="Suki na anime" fr="Anime préférés" works={anime} href={full} />
              <FavRow label="Suki na manga" fr="Mangas préférés" works={manga} href={full} />
            </section>
          )}

          {music.length > 0 && (
            <section className="qv-block" aria-label="Musique">
              <p className="qv-h"><RomajiLabel romaji="Ongaku" fr="Sa musique favorite" inline /></p>
              <MemberMusic tracks={music} owner={member.name} compact />
            </section>
          )}
        </div>

        <div className="qv-foot">
          <Link className="gk-btn qv-full" href={full} onClick={(e) => {
            // Clic simple : portraits et nom glissent vers la fiche complète.
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            viewTransition({ kind: "page", update: async () => { router.push(full); await waitFor(`[data-member-page="${member.id}"]`, 700); } });
          }}>Voir la fiche complète <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
      <ShareSheet member={member} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>,
    document.body
  );
}
