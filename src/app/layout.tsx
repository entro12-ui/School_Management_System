import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.entroethiopia.com"),
  title: {
    default: "EduSync SMS — School Management Platform (KG–12)",
    template: "%s | EduSync SMS",
  },
  description:
    "EduSync SMS is a secure, multi-branch school management platform for KG–12 schools — academics, attendance, finance, library, HR, parent communication, and AI-supported insights in one workspace.",
  applicationName: "EduSync SMS",
  authors: [{ name: "Entro Ethiopia Software Development PLC" }],
  creator: "Entro Ethiopia Software Development PLC",
  publisher: "Entro Ethiopia Software Development PLC",
  keywords: [
    "school management system",
    "SaaS for schools",
    "student information system",
    "KG-12",
    "EduSync SMS",
    "Ethiopia school software",
  ],
  openGraph: {
    type: "website",
    siteName: "EduSync SMS",
    title: "EduSync SMS — School Management Platform (KG–12)",
    description:
      "A secure, multi-branch school management platform — academics, finance, library, HR, parent communication, and AI-supported insights.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduSync SMS — School Management Platform (KG–12)",
    description:
      "A secure, multi-branch school management platform for KG–12 schools.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
