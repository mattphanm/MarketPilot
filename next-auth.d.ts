import "next-auth";

// purpose: 
// Augmentation - extending an existing 
// TypeScript type from a library.

// This file allows for next-auth, when using auth(), 
// to include a user.id property in the session object

declare module "next-auth" {
    interface Session {
        user: { 
            id: string;
        } & NonNullable<Session["user"]>;
    }
}



