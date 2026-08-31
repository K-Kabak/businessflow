import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    organizationId: string;
    role: UserRole;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string;
    role: UserRole;
  }
}
