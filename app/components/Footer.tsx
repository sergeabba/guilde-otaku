import Link from "next/link";

const links = [
  { href: "/", label: "Membres" },
  { href: "/fighters", label: "Fighters" },
  { href: "/bibliotheque", label: "Bibliothèque" },
  { href: "/bons-plans", label: "Bons Plans" },
  { href: "/atelier", label: "Atelier" },
];

export default function Footer() {
  return (
    <footer style={{
      background: "rgba(5,5,8,0.9)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "40px 20px",
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        textAlign: "center",
      }}>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "14px",
          margin: "0 0 16px",
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
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                fontSize: "15px",
                transition: "color 0.2s",
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
