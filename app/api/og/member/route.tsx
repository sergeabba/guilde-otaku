import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "Membre";
    const rank = searchParams.get("rank") || "Guilde Otaku";
    const photo = searchParams.get("photo") || "";
    const color = searchParams.get("color") || "#c9a84c";
    const badge = searchParams.get("badge") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a12",
            backgroundImage: photo ? `url(${photo})` : "linear-gradient(135deg, #0d0d14 0%, #1a1a2e 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            padding: "40px",
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: photo ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
            }}
          />

          {/* Content card */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              border: `4px solid ${color}`,
              borderRadius: "24px",
              padding: "50px 70px",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            {/* Branding */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: color, letterSpacing: "0.25em", textTransform: "uppercase" }}>
                GUILDE OTAKU
              </span>
            </div>

            {/* Name */}
            <h1
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                margin: "0 0 20px 0",
                textTransform: "uppercase",
                fontStyle: "italic",
              }}
            >
              {name}
            </h1>

            {/* Rank */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: color,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                {rank}
              </span>
            </div>

            {/* Badge */}
            {badge && (
              <p style={{ fontSize: 20, fontWeight: 700, color: "#ffd700", marginTop: "16px", textTransform: "uppercase" }}>
                🏆 {badge}
              </p>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`OG generation failed: ${msg}`, { status: 500 });
  }
}
