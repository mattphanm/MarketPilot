import { auth } from "@/auth";

// Middleware to ensure user is authenticated before accessing certain API routes.
// If not authenticated, responds with 401 Unauthorized

export async function requireUser() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { ok: false as const, status: 401 };
    }
    return { ok: true as const, userId };
    }