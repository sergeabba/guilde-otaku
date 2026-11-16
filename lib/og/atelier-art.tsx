// Aperçu de lien d'une futilité (WhatsApp, Discord…) : l'œuvre entière dans un cadre
// incliné, son titre, sa description, aux couleurs de l'image. 1200 × 630, JPEG léger.
import { ImageResponse } from "next/og";
import type { AtelierTile } from "../atelier-server";
import { GOLD, INK, OG_SIZE, PAPER, loadDisplayFont, loadFonts, portraitData } from "./member-art";
import { hslToHex } from "./palette";
import { paletteFromPixels } from "../palette";

const hexA = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
const safeHex = (c: string | null | undefined) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : GOLD);

/** Coupe à la fin d'un mot, avec points de suspension. */
function cut(s: string, max: number): string {
  if (s.length <= max) return s;
  const head = s.slice(0, max - 1);
  return `${head.slice(0, Math.max(head.lastIndexOf(" "), max * 0.6)).replace(/[\s,;:.]+$/, "")}…`;
}

export async function renderAtelierOg(work: AtelierTile, origin: string): Promise<ImageResponse> {
  const isVideo = !!work.filename?.startsWith("drive:");
  const [fonts, display, img] = await Promise.all([loadFonts(), loadDisplayFont(), work.src ? portraitData(work.src, origin, 1080) : Promise.resolve(null)]);

  // Proportions réelles de l'image : le cadre la montre en entier, sans la rogner.
  let ratio = isVideo ? 16 / 9 : 0.8;
  let accent = safeHex(work.accent);
  if (img) {
    try {
      const buf = Buffer.from(img.split(",")[1], "base64");
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buf).metadata();
      if (meta.width && meta.height) ratio = meta.width / meta.height;
      // Même palette que la galerie (tons chair peu comptés) : chaque aperçu a sa couleur.
      const { data } = await sharp(buf).resize(28, 28, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const m = /hsl\((\d+) (\d+)% (\d+)%\)/.exec(paletteFromPixels(data).vivid);
      if (m) accent = safeHex(hslToHex(Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100));
    } catch { /* proportions et couleur par défaut */ }
  }
  const maxW = isVideo || ratio > 1.1 ? 560 : 430, maxH = 500;
  const frameW = Math.round(Math.min(maxW, maxH * ratio));
  const frameH = Math.round(frameW / ratio);

  const title = cut(work.title || "Une futilité de la Guilde", 70);
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const textW = 1200 - frameW - 64 - 150;
  const titleSize = Math.max(40, Math.min(84, Math.floor(textW / (longest * 0.72)), Math.floor(1500 / Math.max(title.length, 12))));
  const sub = work.description ? cut(work.description, 150) : isVideo ? "Une vidéo de la Guilde Otaku, à regarder sur le site." : "Une création de la Guilde Otaku, à voir en grand sur le site.";

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: INK, color: PAPER, fontFamily: "Barlow", overflow: "hidden" }}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover", opacity: 0.35 }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: `linear-gradient(90deg, ${hexA(INK, 0.97)} 0%, ${hexA(INK, 0.9)} 48%, ${hexA(accent, 0.45)} 100%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 2px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: 630, display: "flex", background: accent }} />

        {/* Texte */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: textW + 64, height: 630, padding: "54px 0 46px 64px" }}>
          <div style={{ display: "flex", alignItems: "stretch", alignSelf: "flex-start", fontFamily: "Barlow Condensed", fontWeight: 900, fontSize: 22, letterSpacing: 3 }}>
            <div style={{ display: "flex", width: 12, background: accent, border: `3px solid ${PAPER}`, borderRight: "none" }} />
            <div style={{ display: "flex", padding: "5px 14px", background: PAPER, color: INK, border: `3px solid ${PAPER}` }}>{isVideo ? "GEKIJŌ · VIDÉO DE LA GUILDE" : "KŌBŌ · LES FUTILITÉS DE LA GUILDE"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Dela Gothic One", fontSize: titleSize, lineHeight: 1.02, color: PAPER, textShadow: `5px 5px 0 ${accent}` }}>{title}</div>
            <div style={{ display: "flex", marginTop: 22, maxWidth: textW, fontSize: 28, lineHeight: 1.35, color: "rgba(244,239,228,0.9)" }}>{sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Dela Gothic One", fontSize: 26, letterSpacing: 1 }}>
            GUILDE OTAKU
            <div style={{ display: "flex", marginLeft: 16, fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 24, color: "rgba(244,239,228,0.6)" }}>{isVideo ? "le Cinéma" : "les futilités"}</div>
          </div>
        </div>

        {/* L'œuvre, entière, dans un cadre incliné à ombre dure */}
        <div style={{ position: "absolute", right: 70, top: Math.round((630 - frameH) / 2), display: "flex", width: frameW + 12, height: frameH + 12, transform: "rotate(-2deg)", border: `6px solid ${PAPER}`, background: INK, boxShadow: `16px 16px 0 ${accent}` }}>
          {img
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={img} width={frameW} height={frameH} alt="" style={{ width: frameW, height: frameH, objectFit: "cover" }} />
            : <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontFamily: "Dela Gothic One", fontSize: 120, color: "rgba(244,239,228,0.12)" }}>{title.slice(0, 1)}</div>}
          {isVideo && (
            <div style={{ position: "absolute", left: Math.round(frameW / 2) - 52, top: Math.round(frameH / 2) - 52, width: 104, height: 104, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 52, background: accent, border: `5px solid ${INK}` }}>
              <div style={{ display: "flex", width: 0, height: 0, marginLeft: 10, borderTop: "22px solid transparent", borderBottom: "22px solid transparent", borderLeft: `36px solid ${INK}` }} />
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [...(await fonts), ...display] }
  );
}
