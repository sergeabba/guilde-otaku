"use client";

import Image from "next/image";
import { useState } from "react";
import { Cake, Trophy } from "lucide-react";
import { Member } from "../../data/members";
import type { ViewMode } from "../types";
import { rankAccents } from "../config/ranks";
import { onColor } from "../utils/color";
import VideoPlayer from "./VideoPlayer";

export default function MemberCard({ member, index, viewMode, onClick }: {
  member: Member;
  index: number;
  viewMode: ViewMode;
  onClick: () => void;
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
      className="mc"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      }}
      aria-label={`Ouvrir la fiche de ${member.name}, ${member.rank}`}
      style={{ "--rk": accent, "--rk-on": onColor(accent), "--i": index } as React.CSSProperties}
    >
      <div key={viewMode} className="mc-media is-swap">
        {videoSrc ? (
          <VideoPlayer src={videoSrc} fit="cover" objectPosition="smart" fullscreenBtn />
        ) : !hasError ? (
          <Image
            src={photoSrc}
            alt=""
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1180px) 25vw, 250px"
            priority={index < 2}
            onError={() => setErrors((e) => ({ ...e, [isAnime ? "anime" : "real"]: true }))}
          />
        ) : (
          <div className="mc-fallback" aria-hidden="true">{isAnime ? "影" : "顔"}</div>
        )}
      </div>
      <div className="mc-tone" aria-hidden="true" />

      <span className="mc-rank">{member.rank}</span>
      <span className="mc-no" aria-hidden="true">{String(member.id).padStart(2, "0")}</span>

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
