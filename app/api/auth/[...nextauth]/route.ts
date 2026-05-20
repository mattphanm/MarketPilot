import { handlers } from "@/auth";

// Allows Auth.js to handle multiple auth paths (e.g., /api/auth/signin, /api/auth/signout) using the same configuration.
export const { GET, POST } = handlers;