"use client";

// Tableau de bord de l'administration : une entrée claire par rubrique, avec le
// nombre réel d'éléments quand la base répond (sinon rien, pas de chiffre inventé).
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clapperboard, Gift, Image as ImageIcon, Users } from "lucide-react";
import AdminShell from "../admin-ui/AdminShell";
import { supabase } from "../../lib/supabase";

const SECTIONS = [
  { href: "/admin-membres", table: "fighters", label: "Membres", desc: "Ajouter, modifier, masquer ou supprimer un membre ; portraits, cadrage, grade, palmarès, favoris, musique, fiche de combat.", icon: Users },
  { href: "/admin-biblio", table: "bibliotheque", label: "Bibliothèque", desc: "Ajouter une œuvre depuis la recherche française, modifier synopsis, verdict et bande-annonce, supprimer.", icon: BookOpen },
  { href: "/admin-film-semaine", table: null, label: "Film de la semaine", desc: "Choisir le film mis en avant et son texte.", icon: Clapperboard },
  { href: "/admin-atelier", table: null, label: "Atelier", desc: "Images et vidéos des créations de la Guilde.", icon: ImageIcon },
  { href: "/admin-bons-plans", table: "bons_plans", label: "Bons plans", desc: "Liens utiles : ajouter, modifier, supprimer.", icon: Gift },
] as const;

export default function AdminHome() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    for (const s of SECTIONS) {
      if (!s.table) continue;
      supabase.from(s.table).select("id", { count: "exact", head: true }).then(({ count, error }) => {
        if (!error && typeof count === "number") setCounts((c) => ({ ...c, [s.table!]: count }));
      });
    }
  }, []);
  return (
    <AdminShell section="tableau" title="Tableau de bord" intro="Choisis une rubrique. Chaque page indique ce qui est enregistré, en cours ou en erreur.">
      <div className="am-hub">
        {SECTIONS.map(({ href, table, label, desc, icon: Icon }) => (
          <Link key={href} href={href} className="am-hub-card">
            <Icon size={24} aria-hidden="true" />
            <strong>{label}</strong>
            {table && counts[table] !== undefined && <b>{counts[table]}<span className="am-sr"> éléments</span></b>}
            <span>{desc}</span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
