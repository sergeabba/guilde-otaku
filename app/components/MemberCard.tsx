"use client";

import Image from "./GImage";
import { useState } from "react";
import { Cake, Trophy } from "lucide-react";
import { Member } from "../../data/members";
import type { ViewMode } from "../types";
import { rankAccents } from "../config/ranks";
import { onColor } from "../utils/color";
import VideoPlayer from "./VideoPlayer";
import { objectPosition } from "../../lib/member-extras";
import { rescuedByFallback } from "../../lib/local-image";
import Sceau from "./guilde/Sceau";
import { starTile } from "./guilde/textures";
import "../styles/arcane-card.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const roman = (n: number) => (n <= 21 ? ROMAN[n - 1] : String(n));
const TILE = starTile("rgba(0,0,0,.2)", 26);

/**
 * Carte de membre en arcane : cadre de papier, champ étoilé à la couleur du grade, numéro
 * romain gravé, sceau du grade, nom sur ruban. Avec un détourage fiable (vue Anime), le
 * personnage sort de sa carte par le haut ; sinon le portrait remplit le champ (anime ou
 * photo réelle, cadrage gardé).
 */
export default function MemberCard({ member, index, viewMode, onClick, cut }: {
  member: Member;
  /** Détourage du portrait anime (lib/cutouts.json), si fiable. */
  cut?: { src: string; w: number; h: number };
  index: number;
  viewMode: ViewMode;
  /** Reçoit l'élément de la carte (point de départ de la transition vers la fiche). */
  onClick: (el: HTMLElement) => void;
  /** Conservé pour compatibilité : la mise en page est désormais gérée en CSS. */
  isMobile?: boolean;
}) {
  const [errors, setErrors] = useState<{ real?: boolean; anime?: boolean }>({});

  const accent = rankAccents[member.rank as keyof typeof rankAccents] ?? "#c9a84c";
  const isAnime = viewMode === "anime";
  const videoSrc = isAnime ? member.animeVideo : member.photoVideo;
  const photoSrc = isAnime ? member.animeChar : member.photo;
  const hasError = !photoSrc || (isAnime ? errors.anime : errors.real);

  return (
    <div
      className={`mc is-arcane${cut && viewMode === "anime" ? " has-cut" : ""}`}
      role="button"
      tabIndex={0}
      data-member-id={member.id}
      data-rank={member.rank}
      onClick={(e) => onClick(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e.currentTarget); }
      }}
      aria-label={`Ouvrir la fiche de ${member.name}, ${member.rank}`}
      style={{ "--rk": accent, "--rk-on": onColor(accent), "--i": index, "--mc-tile": TILE } as React.CSSProperties}
    >
      <span className="mc-field" aria-hidden="true" />
      <div key={viewMode} className="mc-media is-swap">
        {isAnime && cut && !videoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mc-cut" src={cut.src} width={cut.w} height={cut.h} alt="" decoding="async" loading={index < 6 ? "eager" : "lazy"} />
        ) : videoSrc ? (
          <VideoPlayer src={videoSrc} fit="cover" objectPosition="smart" fullscreenBtn />
        ) : !hasError ? (
          <Image
            src={photoSrc}
            alt=""
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1180px) 25vw, 250px"
            priority={index < 2}
            style={{ objectPosition: objectPosition(isAnime ? member.extras?.animeFocus : member.extras?.photoFocus, "50% 0%") }}
            onError={(ev) => { if (!rescuedByFallback(ev.currentTarget)) setErrors((e) => ({ ...e, [isAnime ? "anime" : "real"]: true })); }}
          />
        ) : (
          <div className="mc-fallback" aria-hidden="true">{isAnime ? "Kage" : "Kao"}</div>
        )}
      </div>
      <div className="mc-tone" aria-hidden="true" />
      <span className="mc-holo" aria-hidden="true" />

      <span className="mc-rank">{member.rank}</span>
      <span className="mc-no" aria-hidden="true">{roman(member.id)}</span>
      <Sceau className="mc-seal" rank={member.rank} tone="rank" accent={accent} size={40} />

      <div className="mc-plate">
        {member.badge && (
          <span className="mc-badge">
            <Trophy size={10} strokeWidth={3} aria-hidden="true" />
            {member.badge}
          </span>
        )}
        <div className="mc-name">{member.name}</div>
        {member.birthday && (
          <div className="mc-meta">
            <Cake size={12} aria-hidden="true" />
            {member.birthday}
          </div>
        )}
      </div>
    </div>
  );
}
