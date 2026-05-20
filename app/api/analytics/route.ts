import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Not implemented", route: "GET /api/analytics" },
    { status: 501 }
  );
}
