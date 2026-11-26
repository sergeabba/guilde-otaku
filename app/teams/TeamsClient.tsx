"use client";
import { setFace, useFace } from "../../lib/face";

// Page Teams : filtre basket / foot, puis chaque équipe publiée.
import { useMemo, useState } from "react";
import GuildeHeader from "../components/GuildeHeader";
import TeamBoard, { type TeamMember } from "./TeamBoard";
import type { GuildTeam, Sport } from "../../lib/teams-logic";
import "./teams.css";

type Filter = "tout" | Sport;

export default function TeamsClient({ teams, members, available }: { teams: GuildTeam[]; members: TeamMember[]; available: boolean }) {
  const [filter, setFilter] = useState<Filter>("tout");
  const faceMode = useFace();
  const setFaceMode = setFace;
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const sports = new Set(teams.map((t) => t.sport));
  const shown = teams.filter((t) => filter === "tout" || t.sport === filter);

  return (
    <div className="gk-page tone-dark tm-page">
      <GuildeHeader activePage="teams" accentColor="#4d7dff" tone="dark" />
      <main>
        <header className="gk-wrap tm-hero">
          <p className="tm-kicker">Chīmu · les équipes de la Guilde</p>
          <h1 className="tm-title">Teams <span>Guilde</span></h1>
          <p className="tm-lead">Les cinq de basket et les onze de foot de la Guilde. Touche un joueur pour voir son poste, son numéro, ses stats et son arme.</p>
          <div className="tm-controls">
            {sports.size > 1 && (
              <div className="gk-switch" role="group" aria-label="Sport">
                {(["tout", "basket", "foot"] as Filter[]).map((f) => (
                  <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "tout" ? "Toutes" : f === "basket" ? "Basket" : "Foot"}</button>
                ))}
              </div>
            )}
            <div className="gk-switch" role="group" aria-label="Portraits">
              <button type="button" aria-pressed={faceMode === "anime"} onClick={() => setFaceMode("anime")}>Anime</button>
              <button type="button" aria-pressed={faceMode === "real"} onClick={() => setFaceMode("real")}>Réel</button>
            </div>
          </div>
        </header>
        <div className="gk-wrap tm-list">
          {shown.length === 0 ? (
            <p className="tm-empty">{available ? "Les équipes arrivent bientôt : la Guilde prépare ses compositions." : "Les équipes arrivent bientôt."}</p>
          ) : shown.map((t) => <TeamBoard key={t.id} team={t} members={byId} faceMode={faceMode} />)}
        </div>
      </main>
    </div>
  );
}
