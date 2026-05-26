import { PortalShell } from "@/components/layout/portal-shell";
import { StudentTranscriptDownloads } from "@/components/student/student-transcript-downloads";
import { StudentTranscriptPreview } from "@/components/student/student-transcript-preview";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentTranscriptByUserId } from "@/lib/services/student-transcript";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentTranscriptPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const transcript = await getStudentTranscriptByUserId(session.user.id);
  if (!transcript) redirect("/login");

  const htmlUrl = "/api/student/transcript?format=html";
  const csvUrl = "/api/student/transcript?format=csv";

  return (
    <PortalShell
      title="Transcript"
      subtitle={transcript.student.className ?? transcript.student.branchName}
      nav={STUDENT_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic transcript</h1>
          <p className="text-slate-500">
            Download your official record for university applications or personal records.
          </p>
        </div>
        <Link href="/student/gpa" className="text-sm text-indigo-600 hover:underline">
          GPA tracker →
        </Link>
      </div>

      <div className="mb-6 print:hidden">
        <StudentTranscriptDownloads htmlUrl={htmlUrl} csvUrl={csvUrl} />
      </div>

      <StudentTranscriptPreview data={transcript} />
    </PortalShell>
  );
}
