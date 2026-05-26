"use client";

import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

const links = [
  { href: "/", label: "Membres" },
  { href: "/fighters", label: "Fighters" },
  { href: "/bibliotheque", label: "Bibliothèque" },
  { href: "/bons-plans", label: "Bons Plans" },
  { href: "/atelier", label: "Atelier" },
];

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer style={{
      background: isDark ? "rgba(5,5,8,0.9)" : "rgba(245,243,240,0.95)",
      backdropFilter: "blur(20px)",
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
      padding: "40px 20px",
      fontFamily: "'Barlow Condensed', sans-serif",
      transition: "background 0.5s, border-color 0.5s",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        textAlign: "center",
      }}>
        <p style={{
          color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
          fontSize: "14px",
          margin: "0 0 16px",
          transition: "color 0.5s",
        }}>
          &copy; 2025 Guilde Otaku &mdash; Tous droits r&eacute;serv&eacute;s
        </p>
        <nav style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px 24px",
        }}>
          {links.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="footer-link"
              style={{
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                textDecoration: "none",
                fontSize: "15px",
                transition: "color 0.3s",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
