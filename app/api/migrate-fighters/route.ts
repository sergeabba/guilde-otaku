import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, SERVICE_KEY_MISSING } from "../../../lib/supabase-admin";
import { members } from "../../../data/members";
import { isAdmin } from "../../../lib/auth";
import { revalidateMembers } from "../../../lib/revalidate-members";

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Écritures avec la clé serveur : elles restent possibles quand RLS refuse la clé anon.
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 503 });

  try {

    // Check existing entries to avoid duplicates
    const { count } = await supabase
      .from("fighters")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return NextResponse.json({ success: false, error: "Data already exists — use DELETE first or update manually" }, { status: 409 });
    }

    const rowsToInsert = members.map((m) => {
      return {
        name: m.name,
        rank: m.rank,
        birthday: m.birthday,
        bio: m.bio,
        photo: m.photo,
        animechar: m.animeChar,
        color: m.color,
        badge: m.badge,
        rankjp: m.rankJP,
        stats: m.stats,
        special: m.special
      };
    });

    const { data, error } = await supabase
      .from("fighters")
      .insert(rowsToInsert)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    revalidateMembers();
    return NextResponse.json({ success: true, count: data.length, message: "Migration Supabase Fighters terminée avec succès !" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
