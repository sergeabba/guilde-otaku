import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { members } from "../../../data/members";
import { ADMIN_PASSWORD } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ success: true, count: data.length, message: "Migration Supabase Fighters terminée avec succès !" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
