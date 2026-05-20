import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, GraduationCap } from "lucide-react";

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const isHrManager = params.type === "hr-manager";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Application submitted</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isHrManager
            ? "Your HR Manager application will be reviewed by a branch or super admin. If approved, you will receive a one-time password to access the HR portal."
            : "Your registrar office application will be reviewed by a branch or super admin. If approved, you will receive a one-time password to sign in and set your permanent password."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/login">
            <Button className="w-full">Go to sign in</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              <GraduationCap className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
