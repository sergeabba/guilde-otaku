"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Film, Globe, Heart, Search, Share2, Tv, X } from "lucide-react";
import GuildeHeader from "./GuildeHeader";
import type { SupabaseBonPlanRow } from "../types";
import { useFavorites } from "../hooks/useFavorites";
import { useShare } from "../hooks/useShare";
import { normalize } from "../utils/text";
import { onColor } from "../utils/color";
import "../bons-plans/bons-plans.css";

// Ordre d'affichage des catégories connues ; les autres suivent, telles que saisies.
const KNOWN_ORDER = ["Animes", "Scans", "Films/Séries", "Utiles"];
const CATEGORY_ICON: Record<string, typeof Globe> = { "Animes": Tv, "Scans": BookOpen, "Films/Séries": Film };

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
const safeColor = (c: string | null | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : "#c9a84c");

function Logo({ link }: { link: SupabaseBonPlanRow }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICON[link.category] ?? Globe;
  const src = link.logo || `https://www.google.com/s2/favicons?domain=${hostOf(link.url)}&sz=128`;
  return (
    <span className="bp-logo" aria-hidden="true">
      {failed ? <Icon size={24} /> : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

export default function BonsPlansClient({ initialLinks }: { initialLinks: SupabaseBonPlanRow[] }) {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [searchTerm, setSearchTerm] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [leadShot, setLeadShot] = useState<string | null>(null);
  const { toggle, isFavorite, count: favCount } = useFavorites("bons-plans");
  const { share, Toast } = useShare();

  const categories = useMemo(() => {
    const present = [...new Set(initialLinks.map((l) => l.category).filter(Boolean))];
    return [...KNOWN_ORDER.filter((c) => present.includes(c)), ...present.filter((c) => !KNOWN_ORDER.includes(c)).sort()];
  }, [initialLinks]);

  // Mise en avant : le dernier ajout daté. Rien n'est mis en avant sans date.
  const lead = useMemo(() => {
    const dated = initialLinks.filter((l) => l.created_at && !Number.isNaN(Date.parse(l.created_at)));
    if (!dated.length) return null;
    return dated.reduce((a, b) => (Date.parse(b.created_at) > Date.parse(a.created_at) ? b : a));
  }, [initialLinks]);

  // Aperçu du site pour la mise en avant uniquement (une seule requête)
  useEffect(() => {
    if (!lead) return;
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(lead.url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.image) setLeadShot(d.image); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lead]);

  const filtered = useMemo(() => {
    const q = normalize(searchTerm.trim());
    return initialLinks.filter((l) =>
      (activeCategory === "Tout" || l.category === activeCategory) &&
      (!favOnly || isFavorite(l.id)) &&
      (!q || normalize(`${l.title} ${l.desc} ${hostOf(l.url)}`).includes(q))
    );
  }, [initialLinks, activeCategory, favOnly, isFavorite, searchTerm]);

  const hasFilters = activeCategory !== "Tout" || !!searchTerm || favOnly;
  const reset = () => { setActiveCategory("Tout"); setSearchTerm(""); setFavOnly(false); };
  const shareLink = (l: SupabaseBonPlanRow) => share({ title: `${l.title} | Bons plans de la Guilde`, text: l.desc, url: l.url });
  const showLead = lead && !hasFilters;

  return (
    <div className="gk-page tone-dark bp-page">
      <GuildeHeader activePage="bons-plans" tone="dark" />

      <main className="gk-wrap" style={{ paddingBottom: "clamp(56px, 9vw, 110px)" }}>
        <div className="gk-hero gk-reveal">
          <div className="gk-hero-kicker">
            <p className="gk-chapter"><b>07</b><span>LES PETITES ANNONCES</span></p>
            <span className="gk-jp" aria-hidden="true">お得情報</span>
          </div>
          <h1 className="gk-display gk-h1" style={{ fontSize: "clamp(2.4rem, 10.4vw, 6.6rem)" }}>
            Les Bons Plans <span className="gk-inked">Otaku</span>
          </h1>
          <p className="gk-body gk-hero-lede">
            Les archives secrètes de la Guilde : streams, scans et exclusivités. {initialLinks.length} adresses que les membres se refilent.
          </p>
        </div>

        <div className="bp-tools">
          <div className="gk-field">
            <Search size={18} aria-hidden="true" />
            <input type="search" className="gk-input" placeholder="Chercher une adresse" aria-label="Chercher un bon plan" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button type="button" className="gk-clear no-min" onClick={() => setSearchTerm("")} aria-label="Effacer la recherche">
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
          <span />
          <button type="button" className="gk-chip" aria-pressed={favOnly} onClick={() => setFavOnly((v) => !v)}>
            <Heart size={15} aria-hidden="true" fill={favOnly ? "currentColor" : "none"} />
            <span>Mes favoris <small>{favCount}</small></span>
          </button>
        </div>

        <div className="gk-chips" role="group" aria-label="Filtrer par catégorie" style={{ marginTop: 12 }}>
          <button type="button" className="gk-chip" aria-pressed={activeCategory === "Tout"} onClick={() => setActiveCategory("Tout")}>
            <span>Tout <small>{initialLinks.length}</small></span>
          </button>
          {categories.map((cat) => (
            <button key={cat} type="button" className="gk-chip" aria-pressed={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
              <span>{cat} <small>{initialLinks.filter((l) => l.category === cat).length}</small></span>
            </button>
          ))}
        </div>

        {showLead && (
          <section className="gk-panel bp-lead" aria-label="Dernier ajout" style={{ "--bp": safeColor(lead.color) } as React.CSSProperties}>
            <div className="bp-lead-media">
              {leadShot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="bp-shot" src={leadShot} alt="" referrerPolicy="no-referrer" onError={() => setLeadShot(null)} />
              ) : (
                <Logo link={lead} />
              )}
            </div>
            <div className="bp-lead-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="gk-tag gk-tag--solid">Dernier ajout</span>
                <span className="gk-tag">{lead.category}</span>
              </div>
              <h2>{lead.title}</h2>
              <p className="gk-body">{lead.desc}</p>
              <p className="bp-domain">{hostOf(lead.url)}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                <a className="gk-btn" href={lead.url} target="_blank" rel="noopener noreferrer">
                  Ouvrir le site <ExternalLink size={16} aria-hidden="true" /><span className="gk-sr"> (nouvel onglet)</span>
                </a>
                <button type="button" className="gk-btn gk-btn--ghost" onClick={() => shareLink(lead)}>
                  <Share2 size={16} aria-hidden="true" /> Partager
                </button>
              </div>
            </div>
          </section>
        )}

        <p role="status" aria-live="polite" style={{ margin: "22px 0 0", font: "700 0.95rem var(--gk-font-ui)", color: "var(--gk-dim)" }}>
          {filtered.length} {filtered.length > 1 ? "adresses" : "adresse"}
        </p>

        {filtered.length === 0 ? (
          <div className="gk-empty" style={{ marginTop: 20 }}>
            <div className="gk-empty-glyph" aria-hidden="true">完売</div>
            <h3>{favOnly && favCount === 0 ? "Aucun favori pour l'instant" : initialLinks.length === 0 ? "Le tableau est vide" : "Rien à cette adresse"}</h3>
            <p>
              {favOnly && favCount === 0
                ? "Touche le cœur d'un bon plan pour le garder sous la main. Tes favoris restent sur cet appareil."
                : initialLinks.length === 0
                  ? "Aucun bon plan n'est publié pour le moment."
                  : "Aucun bon plan ne correspond à cette recherche."}
            </p>
            {hasFilters && <button type="button" className="gk-btn" onClick={reset}>Tout réafficher</button>}
          </div>
        ) : (
          <div className="bp-grid gk-stagger" key={`${activeCategory}-${favOnly}`}>
            {filtered.map((l, i) => {
              const color = safeColor(l.color);
              const fav = isFavorite(l.id);
              return (
                <article key={l.id} className="bp-coupon" style={{ "--bp": color, "--bp-on": onColor(color), "--i": i } as React.CSSProperties}>
                  <div className="bp-stub">
                    <Logo link={l} />
                    <span className="bp-stub-cat">{l.category}</span>
                  </div>
                  <div className="bp-body">
                    <h3>{l.title}</h3>
                    <p className="bp-domain">{hostOf(l.url)}</p>
                    <p className="bp-desc">{l.desc}</p>
                    <div className="bp-actions">
                      <a className="gk-btn gk-btn--sm" href={l.url} target="_blank" rel="noopener noreferrer">
                        Ouvrir le site <ExternalLink size={14} aria-hidden="true" /><span className="gk-sr"> {l.title} (nouvel onglet)</span>
                      </a>
                      <button type="button" className="bp-mini no-min" onClick={() => shareLink(l)} aria-label={`Partager ${l.title}`}>
                        <Share2 size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="bp-mini no-min"
                        aria-pressed={fav}
                        onClick={() => toggle(l.id)}
                        aria-label={fav ? `Retirer ${l.title} des favoris` : `Ajouter ${l.title} aux favoris`}
                      >
                        <Heart size={16} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="bp-legal">
          Ces liens mènent vers des sites externes que la Guilde ne gère pas. Leur disponibilité peut changer sans prévenir.
        </p>
      </main>
      <Toast />
    </div>
  );
}
