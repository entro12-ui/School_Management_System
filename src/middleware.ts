import NextAuth from "next-auth";
import { authEdgeConfig } from "@/lib/auth/auth.config";

export const { auth: middleware } = NextAuth(authEdgeConfig);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
