// types/next-auth.d.ts (or any global *.d.ts file)

import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string; // ✅ Add this
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      id?: string;
      phone?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string; // ✅ Add this
    role?: string;
    id?: string;
    phone?: string;
  }
}
