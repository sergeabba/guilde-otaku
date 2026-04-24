import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { isAdmin } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resolveAndCacheMediaAssets } = await import("../../../lib/cover-automation");
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;
    const targetId = body?.id ?? null;

    let query = supabase
      .from("bibliotheque")
      .select("id,title,cover_image,banner_image")
      .order("created_at", { ascending: false });

    if (targetId) {
      query = query.eq("id", targetId);
    }

    const { data, error } = await query;

    if (targetId && (!data || data.length === 0)) {
      return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 });
    }

  if (error) {
    return NextResponse.json({ error: "Erreur de base de données" }, { status: 500 });
  }

    let updated = 0;

    for (const item of data ?? []) {
      const resolved = await resolveAndCacheMediaAssets({
        title: item.title,
        coverUrl: item.cover_image,
        bannerUrl: item.banner_image,
        force,
      });

      const needsUpdate = resolved.coverUrl !== item.cover_image || resolved.bannerUrl !== item.banner_image;
      if (!needsUpdate) continue;

      const { error: updateError } = await supabase
        .from("bibliotheque")
        .update({
          cover_image: resolved.coverUrl,
          banner_image: resolved.bannerUrl,
        })
        .eq("id", item.id);

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({ ok: true, updated, targetId });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
