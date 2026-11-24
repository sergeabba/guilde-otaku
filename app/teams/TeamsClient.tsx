"use client";

// Page Teams : filtre basket / foot, puis chaque équipe publiée.
import { useMemo, useState } from "react";
import GuildeHeader from "../components/GuildeHeader";
import TeamBoard, { type TeamMember } from "./TeamBoard";
import type { GuildTeam, Sport } from "../../lib/teams-logic";
import "./teams.css";

type Filter = "tout" | Sport;

export default function TeamsClient({ teams, members, available }: { teams: GuildTeam[]; members: TeamMember[]; available: boolean }) {
  const [filter, setFilter] = useState<Filter>("tout");
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const sports = new Set(teams.map((t) => t.sport));
  const shown = teams.filter((t) => filter === "tout" || t.sport === filter);

  return (
    <div className="gk-page tone-dark tm-page">
      <GuildeHeader activePage="teams" accentColor="#f97316" tone="dark" />
      <main>
        <header className="gk-wrap tm-hero">
          <p className="tm-kicker">Chīmu · les équipes de la Guilde</p>
          <h1 className="tm-title">Teams</h1>
          <p className="tm-lead">Les cinq de basket et les onze de foot de la Guilde. Touche un joueur pour voir son poste, son numéro, ses stats et son arme.</p>
          {sports.size > 1 && (
            <div className="gk-switch tm-filter" role="group" aria-label="Sport">
              {(["tout", "basket", "foot"] as Filter[]).map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "tout" ? "Toutes" : f === "basket" ? "Basket" : "Foot"}</button>
              ))}
            </div>
          )}
        </header>
        <div className="gk-wrap tm-list">
          {shown.length === 0 ? (
            <p className="tm-empty">{available ? "Les équipes arrivent bientôt : la Guilde prépare ses compositions." : "Les équipes arrivent bientôt."}</p>
          ) : shown.map((t) => <TeamBoard key={t.id} team={t} members={byId} />)}
        </div>
      </main>
    </div>
  );
}
