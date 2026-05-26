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
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow from accent color */}
          <div style={{ position: "absolute", top: "-30%", left: "-20%", width: "70%", height: "100%", display: "flex", background: `radial-gradient(ellipse, ${color}15 0%, transparent 65%)`, borderRadius: "50%" }} />

          {/* Photo — left side with cinematic crop */}
          {photo ? (
            <div style={{ position: "absolute", top: 0, left: 0, width: "52%", height: "100%", display: "flex", overflow: "hidden" }}>
              <img
                src={photo}
                width={624}
                height={630}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
              />
              {/* Fade to right */}
              <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to right, transparent 30%, #050508 95%)" }} />
              {/* Fade top */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "25%", display: "flex", background: "linear-gradient(to bottom, rgba(5,5,8,0.6), transparent)" }} />
              {/* Fade bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "35%", display: "flex", background: "linear-gradient(to top, #050508, transparent)" }} />
            </div>
          ) : (
            <div style={{ position: "absolute", top: 0, left: 0, width: "52%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a12" }}>
              <span style={{ fontSize: 160, opacity: 0.08, color }}>&#9876;</span>
            </div>
          )}

          {/* Vertical accent line */}
          <div style={{ position: "absolute", top: "12%", bottom: "12%", left: "50%", width: 3, display: "flex", borderRadius: 2, background: `linear-gradient(to bottom, transparent, ${color}, transparent)` }} />

          {/* Right content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "52%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "50px 60px 50px 50px",
            }}
          >
            {/* Branding */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ width: 28, height: 3, backgroundColor: color, borderRadius: 2 }} />
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 800, color, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                GUILDE OTAKU
              </span>
            </div>

            {/* Rank */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  padding: "4px 12px",
                  borderRadius: 4,
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                }}
              >
                {rank}
              </span>
            </div>

            {/* Name */}
            <span
              style={{
                fontSize: name.length > 14 ? 56 : 72,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {name}
            </span>

            {/* Badge */}
            {badge && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 14px",
                    borderRadius: 6,
                    background: "linear-gradient(90deg, #b8860b, #ffd700, #b8860b)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {badge}
                  </span>
                </div>
              </div>
            )}

            {/* Separator */}
            <div style={{ display: "flex", width: 50, height: 1, background: "rgba(255,255,255,0.12)", marginBottom: 14 }} />

            {/* URL */}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>
              guilde-otaku.vercel.app
            </span>
          </div>

          {/* Corner accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 70, height: 3, backgroundColor: color }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: 70, backgroundColor: color }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 70, height: 3, backgroundColor: color }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 3, height: 70, backgroundColor: color }} />
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
