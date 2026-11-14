"use client";

// Tableau de bord de l'administration : une entrée claire par rubrique, avec le
// nombre réel d'éléments quand la base répond (sinon rien, pas de chiffre inventé).
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clapperboard, ExternalLink, Gift, Image as ImageIcon, RefreshCw, Users, Video } from "lucide-react";
import { getAdminHeaders } from "../../lib/admin-fetch";
import AdminShell from "../admin-ui/AdminShell";
import { supabase } from "../../lib/supabase";

const SECTIONS = [
  { href: "/admin-membres", table: "fighters", label: "Membres", desc: "Ajouter, modifier, masquer ou supprimer un membre ; portraits, cadrage, grade, palmarès, favoris, musique, fiche de combat.", icon: Users },
  { href: "/admin-biblio", table: "bibliotheque", label: "Bibliothèque", desc: "Ajouter une œuvre depuis la recherche française, modifier synopsis, verdict et bande-annonce, supprimer.", icon: BookOpen },
  { href: "/admin-film-semaine", table: null, label: "Film de la semaine", desc: "Choisir le film mis en avant et son texte.", icon: Clapperboard },
  { href: "/admin-atelier", table: null, label: "Atelier", desc: "Images et vidéos des créations de la Guilde.", icon: ImageIcon },
  { href: "/admin-bons-plans", table: "bons_plans", label: "Bons plans", desc: "Liens utiles : ajouter, modifier, supprimer.", icon: Gift },
] as const;

interface DriveStatus { configured: boolean; folderUrl?: string; collections?: { name: string; count: number }[]; error?: string }

/** Cinéma de la Guilde : les vidéos viennent d'un dossier Google Drive partagé. */
function DrivePanel() {
  const [st, setSt] = useState<DriveStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => fetch("/api/admin/drive", { headers: getAdminHeaders() }).then((r) => r.json()).then(setSt).catch(() => setSt({ configured: true, error: "Lecture de l'état impossible." }));
  useEffect(() => { void Promise.resolve().then(load); }, []);
  async function refresh() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/drive", { method: "POST", headers: getAdminHeaders() });
      if (!r.ok) throw new Error();
      await load();
      setMsg("Liste rafraîchie : les nouvelles vidéos sont dans le Cinéma.");
    } catch { setMsg("Rafraîchissement impossible, réessaie."); } finally { setBusy(false); }
  }
  const total = st?.collections?.reduce((n, c) => n + c.count, 0) ?? 0;
  return (
    <section className="am-panel" aria-labelledby="am-drive-title" style={{ marginTop: 22 }}>
      <h2 id="am-drive-title" style={{ display: "flex", alignItems: "center", gap: 10, font: "900 1.2rem var(--am-font)", textTransform: "uppercase" }}><Video size={20} aria-hidden="true" /> Cinéma de la Guilde</h2>
      {!st ? <p className="am-loading" role="status">Chargement…</p>
        : !st.configured ? (
          <div className="am-alert am-alert--info">
            Pas encore relié à Google Drive. Ajoute dans Vercel (Settings → Environment Variables) <b>GOOGLE_DRIVE_API_KEY</b> (clé d&apos;API Google avec l&apos;API Drive activée) et <b>GOOGLE_DRIVE_FOLDER_ID</b> (l&apos;identifiant du dossier, partagé avec « tous les utilisateurs disposant du lien »), puis redéploie.
          </div>
        ) : (
          <>
            {st.error ? <p className="am-alert am-alert--error" role="alert">{st.error}</p>
              : <p>{total} vidéo{total > 1 ? "s" : ""}{st.collections?.length ? ` dans ${st.collections.length} collection${st.collections.length > 1 ? "s" : ""} : ${st.collections.map((c) => `${c.name} (${c.count})`).join(", ")}` : ""}.</p>}
            <p className="am-intro" style={{ margin: 0 }}>Pour ajouter des vidéos : dépose-les dans le dossier Drive (un sous-dossier = une collection), puis rafraîchis. Le titre affiché est le nom du fichier ; la description Drive sert de résumé.</p>
            <div className="am-row">
              {st.folderUrl && <a className="am-btn am-btn--gold" href={st.folderUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" /> Ouvrir le dossier Drive</a>}
              <button type="button" className="am-btn" onClick={refresh} disabled={busy}><RefreshCw size={16} className={busy ? "am-spin" : ""} aria-hidden="true" /> {busy ? "Rafraîchissement…" : "Rafraîchir la liste"}</button>
              <Link className="am-btn" href="/cinema">Voir le Cinéma</Link>
            </div>
            {msg && <p className="am-status is-saved" role="status">{msg}</p>}
          </>
        )}
    </section>
  );
}

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
      <DrivePanel />
    </AdminShell>
  );
}
