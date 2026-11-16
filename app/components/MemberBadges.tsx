"use client";

// Badges automatiques d'un membre (page Jeux) sur sa fiche : rien si aucun badge.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Award } from "lucide-react";
import type { Badge } from "../../lib/games/badges";

export default function MemberBadges({ id }: { id: number }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => {
    let alive = true;
    fetch(`/api/games/badges?member=${id}`).then((r) => r.json()).then((d) => { if (alive) setBadges(d.members?.[0]?.badges ?? []); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);
  if (!badges.length) return null;
  return (
    <div className="pf-badges" aria-label="Badges gagnés">
      <Link href="/jeux" className="pf-badges-title"><Award size={15} aria-hidden="true" /> Badges</Link>
      {badges.map((b) => <span key={b.id} className={`pf-badge is-${b.tier}`} title={b.desc}>{b.label}</span>)}
    </div>
  );
}
