import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { dailyChar } from "../../../../../lib/games/dle";
import { parisDay } from "../../../../../lib/games/arcade";

// Portrait pixelisé du perso du jour : l'image nette ne quitte jamais le serveur avant la fin.
// Niveau 1 : 10 pixels de large ; niveau 2 : 22 pixels.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("d") ?? "";
  const level = sp.get("l") === "2" ? 2 : 1;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > parisDay()) return new NextResponse("Date invalide", { status: 400 });
  try {
    const c = await dailyChar(date);
    const res = await fetch(c.image, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(String(res.status));
    const src = Buffer.from(await res.arrayBuffer());
    const small = await sharp(src).resize({ width: level === 1 ? 10 : 22 }).png().toBuffer();
    const out = await sharp(small).resize({ width: 300, kernel: "nearest" }).png().toBuffer();
    return new NextResponse(new Uint8Array(out), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return new NextResponse("Image indisponible", { status: 502 });
  }
}
