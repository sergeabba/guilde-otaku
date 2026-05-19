import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Barlow Condensed', sans-serif",
      padding: "20px",
    }}>
      <h1 style={{
        fontSize: "clamp(100px, 20vw, 200px)",
        color: "#c9a84c",
        margin: 0,
        lineHeight: 1,
        fontWeight: 900,
      }}>
        404
      </h1>
      <p style={{
        fontSize: "clamp(18px, 3vw, 24px)",
        color: "rgba(255,255,255,0.7)",
        margin: "16px 0 40px",
        textAlign: "center",
      }}>
        Cette page n&apos;existe pas dans la Guilde.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "12px 32px",
          background: "#c9a84c",
          color: "#050508",
          borderRadius: "999px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "16px",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
