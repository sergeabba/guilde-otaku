"use client";

// Une équipe de la Guilde, façon anime de sport : le cinq de basket en cartes de
// joueurs (présentation d'avant-match), le onze de foot en écussons sur le terrain.
// Toucher un joueur ouvre sa fiche de match à côté (poste, numéro, stats, arme).
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Crown, Flame, Zap } from "lucide-react";
import Image from "../components/GImage";
import { onColor } from "../utils/color";
import { SPORT_LABEL, slotsOf, teamPower, type GuildTeam, type SlotDef, type TeamSlot } from "../../lib/teams-logic";

export interface TeamMember {
  id: number; name: string; rank: string; image: string; pos: string;
  stats: { force?: number; vitesse?: number; technique?: number } | null;
  special: string | null; bankai: string | null;
}
type Player = { def: SlotDef; slot: TeamSlot; m: TeamMember };

const DEFAULT_COLOR = { basket: "#f97316", foot: "#2563eb" } as const;
const first = (name: string) => name.replace(/["“”«»()]/g, " ").trim().split(/\s+/)[0];
const initials = (name: string) => name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "G";

export default function TeamBoard({ team, members, preview = false }: { team: GuildTeam; members: Map<number, TeamMember>; preview?: boolean }) {
  const color = team.color ?? DEFAULT_COLOR[team.sport];
  const defs = slotsOf(team.sport, team.formation);
  const players: Player[] = defs.flatMap((def) => {
    const slot = team.slots.find((x) => x.slot === def.id);
    const m = slot && members.get(slot.memberId);
    return slot && m ? [{ def, slot, m }] : [];
  });
  const empty = defs.filter((d) => !players.some((p) => p.def.id === d.id));
  const [picked, setPicked] = useState<number | null>(null);
  const current = players.find((p) => p.m.id === picked) ?? players.find((p) => p.slot.captain) ?? players[0] ?? null;
  const power = teamPower(players.map((p) => p.m.stats));
  const style = { "--tm": color, "--tm-on": onColor(color) } as React.CSSProperties;

  return (
    <section className={`tm-team is-${team.sport}`} style={style} aria-labelledby={`tm-${team.id}`} data-gk-motion="">
      <header className="tm-banner">
        <span className="tm-crest" aria-hidden="true"><b>{initials(team.name)}</b></span>
        <div className="tm-banner-text">
          <p className="tm-sport">{SPORT_LABEL[team.sport]}{team.sport === "foot" ? ` · ${team.formation}` : ""}</p>
          <h2 id={`tm-${team.id}`} className="tm-name">{team.name}</h2>
          {team.motto && <p className="tm-motto">« {team.motto} »</p>}
        </div>
        {power !== null && (
          <div className="tm-power" title="Moyenne des stats des titulaires">
            <span>Puissance</span><b>{power}</b>
            <i aria-hidden="true"><em style={{ width: `${power}%` }} /></i>
          </div>
        )}
      </header>

      {players.length === 0 ? (
        <p className="tm-empty">Effectif à venir : aucun titulaire choisi pour l&apos;instant.</p>
      ) : (
        <div className="tm-body">
          {team.sport === "basket" ? (
            <ol className="tm-five" aria-label="Cinq majeur">
              {players.map((p, i) => (
                <li key={p.def.id} style={{ "--i": i } as React.CSSProperties}>
                  <button type="button" className="tm-card" aria-pressed={current?.m.id === p.m.id} onClick={() => setPicked(p.m.id)} aria-label={`${p.m.name}, ${p.def.label}${p.slot.number !== undefined ? `, numéro ${p.slot.number}` : ""}`}>
                    <span className="tm-card-no" aria-hidden="true">{p.slot.number ?? ""}</span>
                    <span className="tm-card-img"><Image src={p.m.image} alt="" fill sizes="220px" style={{ objectFit: "cover", objectPosition: p.m.pos }} /></span>
                    <span className="tm-card-pos">{p.def.id}</span>
                    {p.slot.captain && <span className="tm-cap" title="Capitaine"><Crown size={14} aria-hidden="true" /></span>}
                    <span className="tm-card-name">{first(p.m.name)}</span>
                  </button>
                </li>
              ))}
              {empty.map((d, i) => (
                <li key={d.id} style={{ "--i": players.length + i } as React.CSSProperties}>
                  <span className="tm-card is-ghost" aria-label={`${d.label} : poste à pourvoir`}><span className="tm-card-pos">{d.id}</span><span className="tm-card-name">À recruter</span></span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="tm-pitch" aria-label={`Onze de départ en ${team.formation}`} role="group">
              <span className="tm-lines" aria-hidden="true"><i className="tm-box is-top" /><i className="tm-box is-bottom" /><i className="tm-circle" /></span>
              {empty.map((d) => (
                <span key={d.id} className="tm-ghost" style={{ left: `${d.x}%`, top: `${d.y}%` }} title={`${d.label} : poste à pourvoir`}><b>{d.code}</b></span>
              ))}
              {players.map((p, i) => (
                <button key={p.def.id} type="button" className="tm-badge" aria-pressed={current?.m.id === p.m.id} onClick={() => setPicked(p.m.id)}
                  style={{ left: `${p.def.x}%`, top: `${p.def.y}%`, "--i": i } as React.CSSProperties}
                  aria-label={`${p.m.name}, ${p.def.label}${p.slot.number !== undefined ? `, numéro ${p.slot.number}` : ""}`}>
                  <span className="tm-badge-shape">
                    <Image src={p.m.image} alt="" fill sizes="80px" style={{ objectFit: "cover", objectPosition: p.m.pos }} />
                    {p.slot.number !== undefined && <b className="tm-badge-no">{p.slot.number}</b>}
                  </span>
                  <span className="tm-badge-name">{p.slot.captain && <Crown size={11} aria-hidden="true" />}{first(p.m.name)}</span>
                </button>
              ))}
            </div>
          )}

          {current && <PlayerSheet key={current.m.id} p={current} preview={preview} />}
        </div>
      )}
    </section>
  );
}

function PlayerSheet({ p, preview }: { p: Player; preview: boolean }) {
  const st = p.m.stats;
  return (
    <aside className="tm-sheet" aria-live="polite">
      <div className="tm-sheet-img"><Image src={p.m.image} alt={`${p.m.name}, version anime`} fill sizes="(max-width: 899px) 40vw, 260px" style={{ objectFit: "cover", objectPosition: p.m.pos }} /></div>
      <div className="tm-sheet-body">
        <p className="tm-sheet-kick">{p.slot.number !== undefined ? `N° ${p.slot.number} · ` : ""}{p.def.label}{p.slot.captain ? " · Capitaine" : ""}</p>
        <h3 className="tm-sheet-name">{p.m.name}</h3>
        <p className="tm-sheet-rank">{p.m.rank}</p>
        {st && (
          <dl className="tm-sheet-stats">
            {(["force", "vitesse", "technique"] as const).map((k) => (
              <div key={k}><dt>{k}</dt><dd><i aria-hidden="true"><em style={{ width: `${Math.min(100, st[k] ?? 0)}%` }} /></i><b>{st[k] ?? 0}</b></dd></div>
            ))}
          </dl>
        )}
        {p.m.special && <p className="tm-sheet-skill"><Zap size={15} aria-hidden="true" /> <span>Arme</span> {p.m.special}</p>}
        {p.m.bankai && <p className="tm-sheet-skill"><Flame size={15} aria-hidden="true" /> <span>Bankai</span> <i lang="ja-Latn">{p.m.bankai}</i></p>}
        {!preview && <Link className="gk-btn gk-btn--sm tm-sheet-link" href={`/membres/${p.m.id}`}>Sa fiche <ArrowRight size={15} aria-hidden="true" /></Link>}
      </div>
    </aside>
  );
}
