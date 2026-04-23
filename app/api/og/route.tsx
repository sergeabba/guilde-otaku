import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Guilde Otaku";
    const subtitle = searchParams.get("subtitle") || "Le trombinoscope légendaire et bien plus encore.";
    const imageUrl = searchParams.get("image"); // Optionnel : une image d'arrière-plan

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
            backgroundColor: "#000", /* Fallback */
            backgroundImage: imageUrl ? `url(${imageUrl})` : "linear-gradient(135deg, #0d0d14 0%, #1a1a2e 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            padding: "40px",
          }}
        >
          {/* Overlay sombre si on a une image de fond */}
          {imageUrl && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
              }}
            />
          )}
          
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              border: "4px solid rgba(201, 168, 76, 0.4)",
              borderRadius: "24px",
              padding: "40px 60px",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: "#c9a84c", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                GUILDE OTAKU
              </span>
            </div>
            
            <h1
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.1,
                margin: "0 0 20px 0",
                textTransform: "uppercase",
                fontStyle: "italic",
              }}
            >
              {title}
            </h1>
            
            <p
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: "#ccc",
                margin: 0,
                maxWidth: "800px",
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
