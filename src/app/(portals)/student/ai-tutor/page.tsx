import { PortalShell } from "@/components/layout/portal-shell";
import { AiStudyTutor } from "@/components/student/ai-study-tutor";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentByUserId } from "@/lib/services/student";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentAiTutorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  if (!student) redirect("/login");

  return (
    <PortalShell
      title="AI Study Tutor"
      subtitle={student.class?.name ?? student.branch.name}
      nav={STUDENT_NAV}
    >
      <AiStudyTutor
        studentName={`${student.firstName} ${student.lastName}`.trim()}
        gradeLevel={student.gradeLevel}
        stream={student.stream}
        schoolName={student.branch.name}
        className={student.class?.name}
      />
    </PortalShell>
  );
}
