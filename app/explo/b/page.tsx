import type { Metadata } from "next";
import { exploData } from "../../../lib/explo-data";
import { FR_MONTHS, nextBirthdays, studioMembers } from "../../../lib/studio-data";
import MenuB, { type BEntry } from "./MenuB";
import "./b.css";

export const metadata: Metadata = { title: "Exploration B · Grand menu | Guilde Otaku" };

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// DIRECTION B · « Grand menu » : l'accueil est le menu principal d'un JRPG de la Guilde.
// Chaque rubrique a son hôte, choisi d'après les données ; l'écran « Nakama » est une
// sélection d'équipe. Clavier : flèches, Entrée, Échap. Téléphone : barres inclinées au pouce.
export default async function ExploB() {
  const [{ members, starId, week }, all] = await Promise.all([exploData(), studioMembers()]);
  const cast = members.filter((m) => m.cut);
  const star = cast.find((m) => m.id === starId) ?? cast[0];
  const best = (k: "force" | "vitesse" | "technique") => [...cast].filter((m) => m.stats).sort((a, b) => b.stats![k] - a.stats![k])[0] ?? star;
  const reader = [...cast].sort((a, b) => b.works.length - a.works.length)[0] ?? star;
  const bday = nextBirthdays(all, new Date(), 6).find((b) => cast.some((c) => c.id === b.m.id));
  const bdayM = bday ? cast.find((c) => c.id === bday.m.id)! : star;
  const entries: BEntry[] = [
    { id: "nakama", label: "Nakama", href: "#nakama", host: star.id, why: "En couverture cette semaine" },
    { id: "fighters", label: "Fighters", href: "/fighters", host: best("force").id, why: `Le plus fort · force ${best("force").stats?.force ?? ""}` },
    { id: "teams", label: "Teams", href: "/teams", host: best("vitesse").id, why: `Le plus rapide · vitesse ${best("vitesse").stats?.vitesse ?? ""}` },
    { id: "biblio", label: "Bibliothèque", href: "/bibliotheque", host: reader.id, why: `Le plus lecteur · ${reader.works.length} séries favorites` },
    { id: "jeux", label: "Salle de jeux", href: "/jeux", host: best("technique").id, why: `Le plus technique · technique ${best("technique").stats?.technique ?? ""}` },
    { id: "hebdo", label: "Anniversaires", href: "/birthdays", host: bdayM.id, why: bday ? `Prochain anniversaire · ${bday.days === 0 ? "aujourd'hui" : `J-${bday.days}`}` : "Anniversaires" },
  ];
  const now = new Date();
  return (
    <MenuB members={members} entries={entries} hud={{ day: DAYS[now.getDay()], date: `${now.getDate()} ${FR_MONTHS[now.getMonth()].slice(0, 4)}.`, week, count: members.length, ranks: new Set(members.map((m) => m.rank)).size }} />
  );
}
