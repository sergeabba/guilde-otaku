import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1111";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false }, { status: 401 });
}
