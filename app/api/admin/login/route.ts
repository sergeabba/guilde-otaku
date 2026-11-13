import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, checkAdminPassword, createAdminSession, isAdminConfigured } from "../../../../lib/admin-session";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Administration non configuree : definir un ADMIN_PASSWORD robuste sur le serveur." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const body = await req.json();
    if (!checkAdminPassword(body?.password)) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const token = createAdminSession();
    if (!token) return NextResponse.json({ error: "Administration indisponible" }, { status: 503 });
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
  }
}
