import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", route: "POST /api/upload" },
    { status: 501 }
  );
}
