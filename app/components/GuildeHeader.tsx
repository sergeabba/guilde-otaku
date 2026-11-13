"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Menu, Moon, ScrollText, Search, Sun, Swords, UsersRound, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { NAV, chapterNo, type PageId } from "../config/nav";

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
  { id: "membres", label: "La Guilde", href: "/", Icon: UsersRound },
  { id: "wanted", label: "Wanted", href: "/wanted", Icon: ScrollText },
  { id: "fighters", label: "Fighters", href: "/fighters", Icon: Swords },
  { id: "bibliotheque", label: "Biblio", href: "/bibliotheque", Icon: BookOpen },
] as const;

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
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolvedTone: "dark" | "light" =
    tone ?? (textColor ? (textColor === "#111" ? "light" : "dark") : isDark ? "dark" : "light");

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  }, []);

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
          <img src="/logo.png" alt="" width={44} height={38} />
          <div>
            <div className="gk-brand-name">GUILDE OTAKU</div>
            <div className="gk-brand-sub">
              DEPUIS 2020 <i aria-hidden="true">オタクギルド</i>
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

      <nav className="gk-nav" aria-label="Rubriques">
        {NAV.map((l, i) => (
          <Link key={l.id} href={l.href} aria-current={activePage === l.id ? "page" : undefined}>
            {l.label}
            <sup aria-hidden="true">{chapterNo(i)}</sup>
          </Link>
        ))}
      </nav>

      {activePage !== "fighters" && <nav className="gk-mobile-dock" aria-label="Navigation rapide">
        {QUICK_LINKS.map(({ id, label, href, Icon }) => (
          <Link key={id} href={href} aria-current={activePage === id ? "page" : undefined}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="gk-chapter-menu"
          aria-label="Ouvrir les autres chapitres"
        >
          <Menu aria-hidden="true" />
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
            <strong>SOMMAIRE <span className="gk-jp" aria-hidden="true">目次</span></strong>
            <button type="button" className="gk-icon-btn" onClick={closeMenu} aria-label="Fermer le sommaire">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <ul className="gk-menu-list">
            {NAV.map((l, i) => (
              <li key={l.id} style={{ "--i": i } as React.CSSProperties}>
                <Link
                  href={l.href}
                  aria-current={activePage === l.id ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <b aria-hidden="true">{chapterNo(i)}</b>
                  <span>{l.label}</span>
                  <i aria-hidden="true">{l.jp}</i>
                </Link>
              </li>
            ))}
          </ul>
          <div className="gk-menu-foot">
            <button
              type="button"
              className="gk-btn gk-btn--ghost gk-btn--sm"
              onClick={() => { setMenuOpen(false); openSearch(); }}
            >
              <Search size={16} aria-hidden="true" /> Rechercher
            </button>
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
