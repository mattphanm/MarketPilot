// Server-only: this helper reads the real session and must not be imported into client code because client state can be altered or bypassed.
import "server-only"
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper Function to ensure user is authenticated before accessing certain API routes.
// If not authenticated, responds with 401 Unauthorized

export type RequireUserResult =
  | {
      ok: true;
      userId: string;
  }
  | {
    ok: false;
    status: 401;
  }

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireUser(): Promise<RequireUserResult> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { ok: false as const, status: 401 };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
        return { ok: false as const, status: 401 };
    }
    return { ok: true as const, userId };
    }
