import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authEdgeConfig } from "@/lib/auth/auth.config";
import { getOtpExpiryDays } from "@/lib/system-settings";

async function passwordMatches(
  plain: string,
  hash: string,
  pendingOtp: string | null,
  otpIssuedAt: Date | null
): Promise<boolean> {
  if (await bcrypt.compare(plain, hash)) return true;
  // OTP shown on enrollment sheet is stored in plain text until password is changed
  if (pendingOtp && pendingOtp === plain) {
    if (otpIssuedAt) {
      const expiryDays = await getOtpExpiryDays();
      const expires = new Date(otpIssuedAt);
      expires.setDate(expires.getDate() + expiryDays);
      if (new Date() > expires) return false;
    }
    return true;
  }
  return false;
}

export const authConfig = {
  ...authEdgeConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password).trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true },
          });

          if (!user || !user.isActive) return null;

          const valid = await passwordMatches(
            password,
            user.passwordHash,
            user.pendingOtp,
            user.otpIssuedAt
          );
          if (!valid) return null;

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            organizationId: user.organizationId,
            branchId: user.branchId,
            branchName: user.branch?.name ?? null,
            mustChangePassword: user.mustChangePassword,
            photoUrl: user.photoUrl,
          };
        } catch (error) {
          console.error("[auth] Login failed for", email, error);
          return null;
        }
      },
    }),
  ],
};
