import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";
import { ROLE_HOME } from "@/lib/auth/role-home";

export const authEdgeConfig = {
  // Required on Render/Vercel — proxy host differs from NEXTAUTH_URL without this
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.branchId = user.branchId as string | null;
        token.branchName = user.branchName as string | null;
        token.mustChangePassword = user.mustChangePassword as boolean;
        token.photoUrl = (user.photoUrl as string | null) ?? null;
      }
      if (trigger === "update" && session) {
        const patch = session as { mustChangePassword?: boolean };
        if (typeof patch.mustChangePassword === "boolean") {
          token.mustChangePassword = patch.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.branchId = (token.branchId as string | null) ?? null;
        session.user.branchName = (token.branchName as string | null) ?? null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.photoUrl = (token.photoUrl as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublic =
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/register");

      if (isPublic) return true;
      if (!isLoggedIn) return false;

      // Always allow password change screen when signed in (before role gates).
      if (path.startsWith("/change-password")) return true;

      if (
        auth.user.mustChangePassword &&
        !path.startsWith("/change-password") &&
        !path.startsWith("/api/auth")
      ) {
        return Response.redirect(new URL("/change-password", request.nextUrl));
      }

      const role = auth.user.role;

      if (path.startsWith("/admin") && role !== "SUPER_ADMIN") return false;
      if (
        path.startsWith("/branch") &&
        !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(role)
      )
        return false;
      if (
        path.startsWith("/registrar") &&
        !["REGISTRAR", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role)
      )
        return false;
      if (path.startsWith("/teacher") && role !== "TEACHER" && role !== "SUPER_ADMIN")
        return false;
      if (
        path.startsWith("/finance") &&
        !["FINANCE_OFFICER", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role)
      )
        return false;
      if (
        path.startsWith("/library") &&
        !["LIBRARIAN", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role)
      )
        return false;
      if (
        path.startsWith("/hr") &&
        !["HR_OFFICER", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role)
      )
        return false;
      if (path.startsWith("/parent") && role !== "PARENT") return false;
      if (path.startsWith("/student") && role !== "STUDENT") return false;

      if (path === "/dashboard" || path === "/home") {
        return Response.redirect(new URL(ROLE_HOME[role], request.nextUrl));
      }

      return true;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
