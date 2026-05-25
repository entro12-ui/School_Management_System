import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { PortalShell } from "@/components/layout/portal-shell";
import { RegistrarSemesterTranscript } from "@/components/registrar/registrar-semester-transcript";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import { getRegistrarSemesterTranscript } from "@/lib/services/registrar-transcript";

export const dynamic = "force-dynamic";

const MANAGE_ROLES: UserRole[] = [
  UserRole.REGISTRAR,
  UserRole.BRANCH_ADMIN,
  UserRole.SUPER_ADMIN,
];

export default async function RegistrarStudentTranscriptPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!MANAGE_ROLES.includes(session.user.role)) redirect("/login");

  const { studentId } = await params;
  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId ?? undefined;

  const transcript = await getRegistrarSemesterTranscript(studentId, {
    branchId,
    issuedByUserId: session.user.id,
  });
  if (!transcript) notFound();

  return (
    <PortalShell
      title="Official transcript"
      subtitle={`${transcript.student.fullName} · ${transcript.student.studentId}`}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 print:hidden">
        <Link
          href={`/registrar/students/${studentId}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to student record
        </Link>
      </div>

      <RegistrarSemesterTranscript data={transcript} />
    </PortalShell>
  );
}
