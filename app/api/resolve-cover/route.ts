import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resolveAndCacheMediaAssets } = await import("../../../lib/cover-automation");
    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const anilistId = typeof body?.anilistId === "number" ? body.anilistId : undefined;
    const coverUrl = typeof body?.coverUrl === "string" ? body.coverUrl : null;
    const bannerUrl = typeof body?.bannerUrl === "string" ? body.bannerUrl : null;
    const force = body?.force === true;

    if (!title && !coverUrl) {
      return NextResponse.json({ error: "title ou coverUrl requis" }, { status: 400 });
    }

    const result = await resolveAndCacheMediaAssets({
      title: title || undefined,
      anilistId,
      coverUrl,
      bannerUrl,
      force,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
