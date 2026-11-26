import type { Metadata } from "next";
import { exploData } from "../../../../lib/explo-data";
import TabNav from "../TabNav";
import FaceToggle from "../../../components/FaceToggle";
import { hosts } from "../parts";
import Annuaire from "./Annuaire";
import "../a.css";
import "./annuaire-a.css";

export const metadata: Metadata = { title: "Exploration A · Les nakama | Guilde Otaku" };

// Phase 2 · l'annuaire dans le langage de la planche : un chapitre par grade, une case par
// membre (personnage qui sort de sa case), et un mode liste rapide pour chercher et comparer.
export default async function AnnuaireA() {
  const { members, starId } = await exploData();
  const star = members.find((m) => m.id === starId && m.cut) ?? members.find((m) => m.cut) ?? members[0];
  return (
    <main className="xa xn" data-explo="/explo/a/annuaire">
      <TabNav hosts={hosts(members, star)} />
      <div className="xa-facebtn"><FaceToggle /></div>
      <Annuaire members={members} />
    </main>
  );
}
