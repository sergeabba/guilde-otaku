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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a12",
            backgroundImage: photo
              ? `url(${photo})`
              : "linear-gradient(135deg, #0d0d14 0%, #1a1a2e 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Overlay sombre */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: photo
                ? "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.95) 100%)"
                : "transparent",
            }}
          />

          {/* Contenu */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "60px 80px",
            }}
          >
            {/* Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div style={{ width: 28, height: 3, background: color, marginRight: 12 }} />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: color,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                GUILDE OTAKU
              </span>
            </div>

            {/* Nom */}
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
                textTransform: "uppercase",
                fontStyle: "italic",
                textAlign: "right",
                marginBottom: 20,
                textShadow: "0 4px 20px rgba(0,0,0,0.8)",
              }}
            >
              {name}
            </div>

            {/* Rang */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 24px",
                border: `2px solid ${color}`,
                borderRadius: 8,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: color,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {rank}
              </span>
            </div>

            {/* Badge */}
            {badge && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <span style={{ fontSize: 20, marginRight: 8 }}>🏆</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#ffd700",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {badge}
                </span>
              </div>
            )}
          </div>

          {/* Accent coins */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 100, height: 4, background: color }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: 100, background: color }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 100, height: 4, background: color }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 4, height: 100, background: color }} />

          {/* URL */}
          <div
            style={{
              position: "absolute",
              bottom: 28,
              left: 40,
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.12em",
            }}
          >
            guilde-otaku.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Failed to generate member OG image", { status: 500 });
  }
}
