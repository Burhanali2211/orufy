import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db/db";
import { sessions, profiles } from "../db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db as any, sessions as any, profiles as any);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production"
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      full_name: attributes.full_name,
      role: attributes.role,
    };
  }
});

// IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  full_name: string | null;
  role: string | null;
}
