import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Guilde Otaku";
    const subtitle = searchParams.get("subtitle") || "Le trombinoscope legendaire et bien plus encore.";
    const rawImageUrl = searchParams.get("image");
    const imageUrl = rawImageUrl && rawImageUrl.startsWith("https://image.tmdb.org/") ? rawImageUrl : null;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#050508",
            overflow: "hidden",
          }}
        >
          {/* Background image or gradient */}
          {imageUrl ? (
            <img
              src={imageUrl}
              width={1200}
              height={630}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(145deg, #0a0a12 0%, #12101f 40%, #0d0815 100%)" }} />
          )}

          {/* Overlay */}
          <div style={{ position: "absolute", inset: 0, display: "flex", background: imageUrl ? "rgba(5,5,8,0.7)" : "transparent" }} />

          {/* Radial glow */}
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "80%", display: "flex", background: "radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-30%", right: "-10%", width: "50%", height: "70%", display: "flex", background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />

          {/* Content */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "60px 80px",
            }}
          >
            {/* Top accent bar */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 40, height: 4, backgroundColor: "#c9a84c", borderRadius: 2 }} />
              <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 800, color: "#c9a84c", letterSpacing: "0.35em", textTransform: "uppercase" }}>
                GUILDE OTAKU
              </span>
            </div>

            {/* Title */}
            <span
              style={{
                fontSize: title.length > 20 ? 64 : 86,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
                textTransform: "uppercase",
                fontStyle: "italic",
                marginBottom: 20,
                maxWidth: "85%",
              }}
            >
              {title}
            </span>

            {/* Subtitle */}
            <span
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
                maxWidth: "70%",
              }}
            >
              {subtitle}
            </span>

            {/* Bottom accent */}
            <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
              <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, #c9a84c, transparent)", borderRadius: 1 }} />
              <span style={{ marginLeft: 14, fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
                DEPUIS 2020
              </span>
            </div>
          </div>

          {/* Corner accents */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 4, backgroundColor: "#c9a84c" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: 120, backgroundColor: "#c9a84c" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 120, height: 4, backgroundColor: "#c9a84c" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 4, height: 120, backgroundColor: "#c9a84c" }} />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Failed to generate the image", { status: 500 });
  }
}
