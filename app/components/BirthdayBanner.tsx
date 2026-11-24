"use client";

// Bannière du jour d'anniversaire : bande d'encre façon manga, portrait du membre,
// « Tanjōbi omedetō », bouton pour aller lui souhaiter sur sa fiche.
// Seulement les membres visibles (fetchMembers écarte ceux masqués dans l'admin).
// Fermée, elle ne revient pas avant le lendemain sur cet appareil.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { fetchMembers, lastMembersFromLocal } from "../utils/dataAdapter";
import { isTodayBirthday } from "../types";
import type { Member } from "../../data/members";
import { optimizedSrc } from "../../lib/img";
import "./birthday-banner.css";

const KEY = "gk-bday-closed";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

export default function BirthdayBanner() {
  const [list, setList] = useState<Member[]>([]);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchMembers()
      .then((members) => {
        // Copie locale (Supabase muet) : elle ignore les membres masqués, pas de bannière.
        if (!alive || lastMembersFromLocal()) return;
        let wasClosed = false;
        try { wasClosed = localStorage.getItem(KEY) === today(); } catch { /* stockage indisponible */ }
        setClosed(wasClosed);
        setList(members.filter((m) => m.birthday && isTodayBirthday(m.birthday)));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (closed || !list.length) return null;
  const close = () => { setClosed(true); try { localStorage.setItem(KEY, today()); } catch { /* stockage indisponible */ } };
  const first = (m: Member) => m.name.split(" ")[0];
  const names = list.length === 1 ? first(list[0]) : `${list.slice(0, -1).map(first).join(", ")} et ${first(list[list.length - 1])}`;
  const href = list.length === 1 ? `/membres/${list[0].id}` : "/birthdays";

  return (
    <div className="guilde-birthday-banner gk-bday" role="status" aria-live="polite">
      <span className="gk-bday-lines" aria-hidden="true" />
      <div className="gk-bday-faces" aria-hidden="true">
        {list.slice(0, 3).map((m) => {
          const src = m.animeChar || m.photo;
          return (
            <span key={m.id} className="gk-bday-face" style={{ "--c": m.color || "#c9a84c" } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src ? <img src={optimizedSrc(src, 96)} alt="" width={40} height={40} /> : <b>{m.name.slice(0, 1)}</b>}
            </span>
          );
        })}
      </div>
      <p className="gk-bday-text">
        <small>Tanjōbi omedetō</small>
        <span>Aujourd&apos;hui, c&apos;est l&apos;anniversaire de <strong>{names}</strong></span>
      </p>
      <Link href={href} className="gk-bday-cta">
        {list.length === 1 ? "Lui souhaiter" : "Leur souhaiter"} <ChevronRight size={15} aria-hidden="true" />
      </Link>
      <button type="button" className="gk-bday-close" onClick={close} aria-label="Fermer la bannière d'anniversaire jusqu'à demain"><X size={16} aria-hidden="true" /></button>
    </div>
  );
}
