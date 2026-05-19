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
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0d0d14 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -120,
              left: -60,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}10 0%, transparent 60%)`,
            }}
          />

          {/* Photo section */}
          <div
            style={{
              width: "45%",
              height: "100%",
              display: "flex",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {photo ? (
              <img
                src={photo}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 15%",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${color}20, ${color}05)`,
                  fontSize: 140,
                }}
              >
                ⚔
              </div>
            )}
            {/* Photo overlay gradient */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "40%",
                height: "100%",
                background: "linear-gradient(to left, #0a0a12, transparent)",
              }}
            />
            {/* Bottom fade */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "30%",
                background: "linear-gradient(to top, #0a0a12, transparent)",
              }}
            />
            {/* Accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 4,
                height: "100%",
                background: color,
              }}
            />
          </div>

          {/* Info section */}
          <div
            style={{
              width: "55%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "60px 50px 60px 40px",
            }}
          >
            {/* Guild branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 3,
                  background: color,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: color,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                GUILDE OTAKU
              </span>
            </div>

            {/* Name */}
            <h1
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 0.9,
                textTransform: "uppercase",
                fontStyle: "italic",
                margin: "0 0 16px 0",
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </h1>

            {/* Rank */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: badge ? 20 : 0,
              }}
            >
              <div
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: `2px solid ${color}`,
                  background: `${color}15`,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: color,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {rank}
                </span>
              </div>
            </div>

            {/* Badge */}
            {badge && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 22 }}>🏆</span>
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

            {/* Footer line */}
            <div
              style={{
                position: "absolute",
                bottom: 40,
                right: 50,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                guilde-otaku.vercel.app
              </span>
            </div>
          </div>

          {/* Top-right corner accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 120,
              height: 4,
              background: color,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 4,
              height: 120,
              background: color,
            }}
          />
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
