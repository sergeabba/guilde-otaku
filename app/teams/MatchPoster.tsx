"use client";

// Affiche de confrontation entre deux équipes du même sport, à la manière des affiches
// d'avant-match des animes de sport (Blue Lock, Haikyuu, Eyeshield 21) : deux couleurs qui
// s'affrontent en diagonale, les capitaines face à face, « VS » au centre, puis le duel
// ligne par ligne. Les chiffres sont calculés d'après les statistiques des titulaires :
// aucun score, aucune date de match inventés.
import { useState } from "react";
import { Crown } from "lucide-react";
import Image from "../components/GImage";
import { lineRatings, LINE_LABEL, slotsOf, teamPower, type GuildTeam } from "../../lib/teams-logic";
import { face, type Face, type TeamMember } from "./TeamBoard";

const DEFAULT_COLOR = { basket: "#f97316", foot: "#2563eb" } as const;

function side(team: GuildTeam, members: Map<number, TeamMember>) {
  const defs = slotsOf(team.sport, team.formation);
  const players = defs.flatMap((def) => {
    const slot = team.slots.find((x) => x.slot === def.id);
    const m = slot && members.get(slot.memberId);
    return slot && m ? [{ def, slot, m }] : [];
  });
  const cap = players.find((p) => p.slot.captain) ?? players[0] ?? null;
  return {
    team, cap, color: team.color ?? DEFAULT_COLOR[team.sport],
    power: teamPower(players.map((p) => p.m.stats)),
    lines: lineRatings(team.sport, players.map((p) => ({ code: p.def.code, stats: p.m.stats }))),
    count: players.length,
  };
}

export default function MatchPoster({ teams, members, faceMode }: { teams: GuildTeam[]; members: Map<number, TeamMember>; faceMode: Face }) {
  // Paires possibles : deux équipes d'un même sport. On choisit la paire affichée.
  const pairs: [GuildTeam, GuildTeam][] = [];
  for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) if (teams[i].sport === teams[j].sport) pairs.push([teams[i], teams[j]]);
  const [k, setK] = useState(0);
  if (!pairs.length) return null;
  const [ta, tb] = pairs[Math.min(k, pairs.length - 1)];
  const a = side(ta, members), b = side(tb, members);
  const Cap = ({ s, flip }: { s: ReturnType<typeof side>; flip?: boolean }) => {
    const p = s.cap && face(s.cap.m, faceMode);
    return (
      <figure className={`mp-cap${flip ? " is-b" : ""}`}>
        <span className="mp-cap-img">{p?.src ? <Image src={p.src} alt="" fill sizes="(max-width: 700px) 50vw, 420px" style={{ objectFit: "cover", objectPosition: p.pos }} /> : null}</span>
        <figcaption>
          <small>{s.team.sport === "foot" ? `${s.team.formation}` : "5 majeur"}</small>
          <strong>{s.team.name}</strong>
          {s.cap && <em><Crown size={13} aria-hidden="true" /> {s.cap.m.name}{s.cap.slot.number !== undefined ? ` · n° ${s.cap.slot.number}` : ""}</em>}
        </figcaption>
      </figure>
    );
  };
  return (
    <section className="mp" aria-labelledby="mp-title" style={{ "--a": a.color, "--b": b.color } as React.CSSProperties}>
      <header className="mp-head">
        <p className="mp-kicker">Taikai · le choc des effectifs</p>
        <h2 id="mp-title" className="gk-sr">{ta.name} contre {tb.name}</h2>
        {pairs.length > 1 && (
          <div className="gk-switch mp-pick" role="group" aria-label="Confrontation">
            {pairs.map(([x, y], i) => <button key={`${x.id}-${y.id}`} type="button" aria-pressed={i === k} onClick={() => setK(i)}>{x.name} / {y.name}</button>)}
          </div>
        )}
      </header>
      <div className="mp-poster">
        <span className="mp-bg" aria-hidden="true" />
        <Cap s={a} />
        <span className="mp-vs" aria-hidden="true">VS</span>
        <Cap s={b} flip />
      </div>
      <dl className="mp-lines">
        {[{ line: "global", label: "Puissance", va: a.power, vb: b.power }, ...a.lines.map((l, i) => ({ line: l.line, label: LINE_LABEL[l.line], va: l.value, vb: b.lines[i]?.value ?? null }))].map((r) => {
          const tot = (r.va ?? 0) + (r.vb ?? 0) || 1;
          const lead = r.va !== null && r.vb !== null ? (r.va > r.vb ? "a" : r.vb > r.va ? "b" : "=") : null;
          return (
            <div key={r.line} className={`mp-line${lead ? ` lead-${lead}` : ""}`}>
              <dd className="mp-va">{r.va ?? "–"}</dd>
              <dt>{r.label}</dt>
              <dd className="mp-vb">{r.vb ?? "–"}</dd>
              <span className="mp-bar" aria-hidden="true"><i style={{ width: `${((r.va ?? 0) / tot) * 100}%` }} /><i style={{ width: `${((r.vb ?? 0) / tot) * 100}%` }} /></span>
            </div>
          );
        })}
      </dl>
      <p className="mp-note">Calculé d&apos;après les statistiques des titulaires ({a.count} contre {b.count}). Aucun résultat de match n&apos;est enregistré.</p>
    </section>
  );
}
