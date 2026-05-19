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
            backgroundColor: "#050508",
            fontFamily: "Inter, sans-serif",
            position: "relative",
          }}
        >
          {/* Photo — occupe 50% gauche */}
          {photo ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "55%",
                height: "100%",
                display: "flex",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                width={660}
                height={630}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 15%",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "55%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0d0d14",
              }}
            >
              <span style={{ fontSize: 180, opacity: 0.15 }}>⚔</span>
            </div>
          )}

          {/* Gradient overlay gauche → droite */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "55%",
              height: "100%",
              background: "linear-gradient(to right, transparent 40%, #050508 100%)",
            }}
          />
          {/* Gradient haut */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "55%",
              height: "35%",
              background: "linear-gradient(to bottom, rgba(5,5,8,0.7), transparent)",
            }}
          />
          {/* Gradient bas */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "55%",
              height: "40%",
              background: "linear-gradient(to top, #050508, transparent)",
            }}
          />

          {/* Accent line verticale */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              bottom: "10%",
              left: "53%",
              width: 3,
              background: color,
              borderRadius: 2,
            }}
          />

          {/* Contenu droite */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "50px 60px 50px 40px",
            }}
          >
            {/* Branding */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 24, height: 3, backgroundColor: color, marginRight: 10 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: color, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                GUILDE OTAKU
              </span>
            </div>

            {/* Rang */}
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: color,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: 12,
              }}
            >
              {rank}
            </span>

            {/* Nom — gros et bold */}
            <span
              style={{
                fontSize: name.length > 12 ? 62 : 78,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: 24,
              }}
            >
              {name}
            </span>

            {/* Badge */}
            {badge && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderRadius: 6,
                    background: "linear-gradient(90deg, #b8860b, #ffd700, #b8860b)",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    🏆 {badge}
                  </span>
                </div>
              </div>
            )}

            {/* Séparateur */}
            <div style={{ width: 60, height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 16 }} />

            {/* URL */}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
              guilde-otaku.vercel.app
            </span>
          </div>

          {/* Déco coin haut-gauche */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 4, backgroundColor: color }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: 80, backgroundColor: color }} />

          {/* Déco coin bas-droite */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 4, backgroundColor: color }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 4, height: 80, backgroundColor: color }} />
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
