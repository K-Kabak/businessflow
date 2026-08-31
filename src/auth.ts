import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { signInSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            organizationId: true,
            role: true,
            name: true,
            email: true,
            avatarUrl: true,
            passwordHash: true,
          },
        });
        if (
          !user ||
          !(await bcrypt.compare(parsed.data.password, user.passwordHash))
        )
          return null;

        return {
          id: user.id,
          organizationId: user.organizationId,
          role: user.role,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id);
      session.user.organizationId = String(token.organizationId);
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
