import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1111";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, token: ADMIN_PASSWORD });
    }
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
