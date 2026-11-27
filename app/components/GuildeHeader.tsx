"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBackClose } from "../hooks/useBackClose";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { IconBiblio, IconFighters, IconGuilde, IconSommaire, IconTeams } from "./GuildeIcons";
import { useTheme } from "../context/ThemeContext";
import { NAV_GROUPS, chapterOf, groupOf, navEntry, type PageId } from "../config/nav";
import { RUBRIC_GLYPHS } from "./guilde/glyphs";
import FaceToggle from "./FaceToggle";
import "../styles/nav-v4.css";

interface GuildeHeaderProps {
  activePage: PageId;
  accentColor?: string;
  /** Fond personnalisé (pages à ambiance propre). */
  bgColor?: string;
  /** "#111" force un en-tête clair, toute autre valeur un en-tête sombre. */
  textColor?: string;
  /** Force le ton quand la page a une ambiance fixe, indépendante du thème global. */
  tone?: "dark" | "light";
  rightSlot?: React.ReactNode;
}

const QUICK_LINKS = [
  { id: "membres", label: "La Guilde", href: "/", Icon: IconGuilde },
  { id: "teams", label: "Teams", href: "/teams", Icon: IconTeams },
  { id: "fighters", label: "Fighters", href: "/fighters", Icon: IconFighters },
  { id: "bibliotheque", label: "Biblio", href: "/bibliotheque", Icon: IconBiblio },
] as const;

/** Emblème de rubrique (même dessin que les sceaux), en petit pour la navigation. */
export function NavGlyph({ id }: { id: PageId }) {
  const g = RUBRIC_GLYPHS[id === "membres" ? "membres" : id];
  return <svg className="gk-glyph" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ "--sc-bg": "var(--gk-bg)" } as React.CSSProperties}><g fill="currentColor">{g}</g></svg>;
}

export function openSearch() {
  window.dispatchEvent(new Event("guilde:search"));
}

export default function GuildeHeader({
  activePage,
  accentColor = "#c9a84c",
  bgColor,
  textColor,
  tone,
  rightSlot,
}: GuildeHeaderProps) {
  const { isDark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  // Rubrique courante sur <html> : le trait de pinceau sous le titre change selon la page.
  useEffect(() => { document.documentElement.dataset.page = activePage; }, [activePage]);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolvedTone: "dark" | "light" =
    tone ?? (textColor ? (textColor === "#111" ? "light" : "dark") : isDark ? "dark" : "light");

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  }, []);

  useBackClose(menuOpen, () => setMenuOpen(false));

  // Menu mobile : verrou du scroll, Échap, piège de focus
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = menuRef.current;
    node?.querySelector<HTMLElement>("a[aria-current='page'], a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key !== "Tab" || !node) return;
      const items = node.querySelectorAll<HTMLElement>("a, button");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const vars = { "--gk-accent": accentColor, ...(bgColor ? { background: bgColor } : {}) } as React.CSSProperties;

  return (
    <header className={`gk-header tone-${resolvedTone}`} style={vars}>
      <div className={`gk-mast${rightSlot ? " has-slot" : ""}`}>
        <Link href="/" className="gk-brand" aria-label="Guilde Otaku, accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-header.png" alt="" width={44} height={38} />
          <div>
            <div className="gk-brand-name">GUILDE OTAKU</div>
            <div className="gk-brand-sub">
              DEPUIS 2020 <i aria-hidden="true">Otaku Girudo</i>
            </div>
          </div>
        </Link>

        <div className="gk-mast-actions">
          {rightSlot}
          <button type="button" className="gk-search-btn" onClick={openSearch} aria-label="Rechercher dans la Guilde">
            <Search size={17} aria-hidden="true" />
            <span>Rechercher</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button
            type="button"
            className="gk-icon-btn gk-theme-btn"
            onClick={toggle}
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <button
            ref={burgerRef}
            type="button"
            className="gk-icon-btn gk-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le sommaire"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <GroupedNav activePage={activePage} />

      {activePage !== "fighters" && <nav className="gk-mobile-dock" aria-label="Navigation rapide">
        {QUICK_LINKS.map(({ id, label, href, Icon }, i) => {
          // La rubrique en cours prend la dernière place quand elle n'a pas son raccourci :
          // on voit toujours où l'on est.
          const here = !QUICK_LINKS.some((q) => q.id === activePage) && i === QUICK_LINKS.length - 1 ? navEntry(activePage) : null;
          if (here) return (
            <Link key={here.id} href={here.href} aria-current="page" className="is-here">
              <NavGlyph id={here.id} />
              <span>{here.label}</span>
            </Link>
          );
          return (
            <Link key={id} href={href} aria-current={activePage === id ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="gk-chapter-menu"
          aria-label="Ouvrir les autres chapitres"
        >
          <IconSommaire />
          <span>Sommaire</span>
        </button>
      </nav>}

      {menuOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          id="gk-chapter-menu"
          className={`gk-menu tone-${resolvedTone}`}
          role="dialog"
          aria-modal="true"
          aria-label="Sommaire"
          style={{ "--gk-accent": accentColor } as React.CSSProperties}
        >
          <div className="gk-menu-head">
            <strong>Sommaire <span className="gk-jp" aria-hidden="true">Mokuji</span></strong>
            <button type="button" className="gk-icon-btn" onClick={closeMenu} aria-label="Fermer le sommaire">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="gk-menu-search" onClick={() => { setMenuOpen(false); openSearch(); }}>
            <Search size={18} aria-hidden="true" /> <span>Un membre, une œuvre, une rubrique…</span>
          </button>
          <div className="gk-menu-groups">
            {NAV_GROUPS.map((g, gi) => (
              <section key={g.id} className="gk-menu-group" style={{ "--i": gi } as React.CSSProperties} aria-label={g.label}>
                <h2>{g.label} <i aria-hidden="true">{g.jp}</i></h2>
                <ul>
                  {g.items.map((id) => { const l = navEntry(id); return (
                    <li key={id}>
                      <Link href={l.href} aria-current={activePage === id ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                        <b className="gk-menu-no" aria-hidden="true">{chapterOf(id)}</b>
                        <NavGlyph id={id} />
                        <span>{l.label}</span>
                        <small>{l.blurb}</small>
                      </Link>
                    </li>
                  ); })}
                </ul>
              </section>
            ))}
          </div>
          <div className="gk-menu-foot">
            <FaceToggle />
            <button type="button" className="gk-btn gk-btn--ghost gk-btn--sm" onClick={toggle}>
              {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              {isDark ? "Mode clair" : "Mode sombre"}
            </button>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

/**
 * Navigation ordinateur : trois familles ; chacune ouvre un panneau avec ses rubriques
 * (survol, clic ou clavier). La famille de la page en cours est mise en avant.
 */
function GroupedNav({ activePage }: { activePage: PageId }) {
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = groupOf(activePage)?.id;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setOpen(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const hover = (id: string | null) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(id), id ? 60 : 180); };
  return (
    <nav ref={navRef} className="gk-nav gk-nav--groups" aria-label="Rubriques" onPointerLeave={(e) => { if (e.pointerType === "mouse") hover(null); }}>
      {NAV_GROUPS.map((g) => (
        <div key={g.id} className={`gk-navg${current === g.id ? " is-current" : ""}${open === g.id ? " is-open" : ""}`} onPointerEnter={(e) => { if (e.pointerType === "mouse") hover(g.id); }}>
          <button type="button" aria-expanded={open === g.id} aria-controls={`gk-navg-${g.id}`} onClick={() => setOpen((o) => (o === g.id ? null : g.id))}>
            <span className="gk-navg-label">{g.label}</span>
            {current === g.id && <span className="gk-navg-here">{navEntry(activePage)?.label}</span>}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          <div id={`gk-navg-${g.id}`} className="gk-navg-panel" hidden={open !== g.id}>
            <span className="gk-navg-jp" aria-hidden="true">{g.jp}</span>
            {g.items.map((id) => { const l = navEntry(id); return (
              <Link key={id} href={l.href} aria-current={activePage === id ? "page" : undefined} onClick={() => setOpen(null)}>
                <b className="gk-navg-no" aria-hidden="true">{chapterOf(id)}</b>
                <NavGlyph id={id} />
                <strong>{l.label}</strong><small>{l.blurb}</small>
              </Link>
            ); })}
          </div>
        </div>
      ))}
    </nav>
  );
}
