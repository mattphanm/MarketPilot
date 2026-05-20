import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";


export async function GET() {
  const user = await requireUser();
  
  if (!user.ok) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: user.status }
    )
  }
  return NextResponse.json({ userId: user.userId });
  }

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", route: "POST /api/trades" },
    { status: 501 }
  );
}
