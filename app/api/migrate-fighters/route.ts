import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { members } from "../../../data/members";

export async function GET() {
  try {
    // 1. On insère tous les membres en utilisant le client Supabase
    // On retire l'ID pour que Supabase utilise sa clé primaire SERIAL
    const rowsToInsert = members.map((m) => {
      return {
        name: m.name,
        rank: m.rank,
        birthday: m.birthday,
        bio: m.bio,
        photo: m.photo,
        animechar: m.animeChar, // PostgreSQL schema cache expected lowercase
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
