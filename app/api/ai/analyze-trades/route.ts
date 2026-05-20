import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", route: "POST /api/ai/analyze-trades" },
    { status: 501 }
  );
}
