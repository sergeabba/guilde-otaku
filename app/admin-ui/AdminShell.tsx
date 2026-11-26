"use client";

// Coque commune des pages d'administration : connexion, navigation entre les
// rubriques (visible sur téléphone comme sur ordinateur), déconnexion.
import Link from "next/link";
import { BookOpen, Clapperboard, ExternalLink, Gift, Image as ImageIcon, LayoutGrid, Lock, LogOut, Newspaper, Shirt, Smile, Users, Vote } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import "../admin-membres/admin-membres.css";
import "./admin-ui.css";

export type AdminSection = "tableau" | "membres" | "bibliotheque" | "film" | "atelier" | "actus" | "bons-plans" | "emojis" | "votes" | "teams";

const NAV: { key: AdminSection; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "tableau", href: "/admin", label: "Tableau", icon: <LayoutGrid size={17} aria-hidden="true" /> },
  { key: "membres", href: "/admin-membres", label: "Membres", icon: <Users size={17} aria-hidden="true" /> },
  { key: "bibliotheque", href: "/admin-biblio", label: "Bibliothèque", icon: <BookOpen size={17} aria-hidden="true" /> },
  { key: "film", href: "/admin-film-semaine", label: "Film de la semaine", icon: <Clapperboard size={17} aria-hidden="true" /> },
  { key: "votes", href: "/admin-votes", label: "Votes de films", icon: <Vote size={17} aria-hidden="true" /> },
  { key: "teams", href: "/admin-teams", label: "Teams", icon: <Shirt size={17} aria-hidden="true" /> },
  { key: "atelier", href: "/admin-atelier", label: "Futilités", icon: <ImageIcon size={17} aria-hidden="true" /> },
  { key: "actus", href: "/admin-actus", label: "Actualités", icon: <Newspaper size={17} aria-hidden="true" /> },
  { key: "bons-plans", href: "/admin-bons-plans", label: "Bons plans", icon: <Gift size={17} aria-hidden="true" /> },
  { key: "emojis", href: "/admin-emojis", label: "Énigmes émojis", icon: <Smile size={17} aria-hidden="true" /> },
];

export default function AdminShell({ section, title, intro, actions, status, children }: {
  section: AdminSection;
  title: string;
  intro?: React.ReactNode;
  /** Boutons principaux de la page (toujours visibles, sans survol). */
  actions?: React.ReactNode;
  /** État d'enregistrement de la page (SaveStatus). */
  status?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { authed, checking, password, setPassword, error, errorMessage, login, logout } = useAdminAuth();

  if (checking) {
    return <div className="am am-page"><p className="am-loading" role="status">Vérification de la session…</p></div>;
  }
  if (!authed) {
    return (
      <div className="am am-page am-login-page">
        <form className="am-login" onSubmit={login}>
          <span className="am-login-icon" aria-hidden="true"><Lock size={24} /></span>
          <p className="am-kicker">Guilde Otaku</p>
          <h1>Espace admin</h1>
          <label className="am-field">
            <span>Mot de passe</span>
            <input className="am-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus aria-invalid={error} aria-describedby={error ? "am-login-err" : undefined} />
          </label>
          {error && <p id="am-login-err" className="am-alert am-alert--error" role="alert">{errorMessage}</p>}
          <button className="am-btn am-btn--gold">Se connecter</button>
          <Link href="/" className="am-link">Retour au site</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="am am-page">
      <header className="am-top">
        <div className="am-top-row">
          <Link href="/admin" className="am-brand"><b>Admin</b> Guilde Otaku</Link>
          <div className="am-top-actions">
            <Link href="/" className="am-btn am-btn--sm" target="_blank" rel="noopener noreferrer" aria-label="Voir le site (nouvel onglet)"><ExternalLink size={15} aria-hidden="true" /><span className="am-top-label">Voir le site</span></Link>
            <button type="button" className="am-btn am-btn--sm" onClick={logout} aria-label="Se déconnecter"><LogOut size={15} aria-hidden="true" /><span className="am-top-label">Se déconnecter</span></button>
          </div>
        </div>
        {/* Téléphone : la rubrique courante, et toutes les rubriques dans une feuille. */}
        {(() => {
          const cur = NAV.find((n) => n.key === section) ?? NAV[0];
          return (
            <details className="am-nav-m">
              <summary>{cur.icon}<span>{cur.label}</span><small>Changer de rubrique</small></summary>
              <nav aria-label="Rubriques de l'administration">
                {NAV.map((n) => (
                  <Link key={n.key} href={n.href} className="am-nav-m-link" aria-current={n.key === section ? "page" : undefined}>{n.icon}<span>{n.label}</span></Link>
                ))}
              </nav>
            </details>
          );
        })()}
        <nav className="am-nav" aria-label="Rubriques de l'administration">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className="am-nav-link" aria-current={n.key === section ? "page" : undefined}>{n.icon}<span>{n.label}</span></Link>
          ))}
        </nav>
      </header>
      <main className="am-main" id="contenu-admin">
        <div className="am-page-head">
          <div>
            <h1>{title}</h1>
            {intro && <p className="am-intro">{intro}</p>}
          </div>
          {(actions || status) && <div className="am-page-actions">{status}{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
