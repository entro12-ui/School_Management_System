import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function RegistrationLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-900">EduSync SMS</span>
          </Link>
          <Link href="/login" className="text-sm text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/register" className="text-sm text-slate-500 hover:text-indigo-600">
          ← All registration types
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Applications are reviewed by your branch administrator before you can sign in.
        </p>
      </main>
    </div>
  );
}
