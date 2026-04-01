import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { DOSSIER_BASH_DATA, findDossierBashEntry } from "../../../lib/dossier-bash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    const { data, error } = await supabase
      .from("bibliotheque")
      .select("id,title,dossier_bash,dossier_bash_tag,dossier_bash_date,dossier_bash_color")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let updated = 0;

    for (const item of data ?? []) {
      const dossierMeta = findDossierBashEntry(item.title);
      const shouldMark = !!dossierMeta;
      const needsUpdate = force ||
        item.dossier_bash !== shouldMark ||
        (shouldMark && (
          item.dossier_bash_tag !== dossierMeta.tag ||
          item.dossier_bash_date !== dossierMeta.date ||
          item.dossier_bash_color !== dossierMeta.color
        ));

      if (!needsUpdate) continue;

      const { error: updateError } = await supabase
        .from("bibliotheque")
        .update({
          dossier_bash: shouldMark,
          dossier_bash_tag: dossierMeta?.tag ?? null,
          dossier_bash_date: dossierMeta?.date ?? null,
          dossier_bash_color: dossierMeta?.color ?? null,
        })
        .eq("id", item.id);

      if (!updateError) {
        updated++;
      }
    }

    return NextResponse.json({
      ok: true,
      updated,
      matched: DOSSIER_BASH_DATA.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
