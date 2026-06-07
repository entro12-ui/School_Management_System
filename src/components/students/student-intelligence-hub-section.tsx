import { UserRole } from "@prisma/client";
import { StudentIntelligenceHub } from "@/components/students/student-intelligence-hub";
import { getStudentPerformanceRiskById } from "@/lib/services/student-performance-analytics";

export async function StudentIntelligenceHubSection({
  studentId,
  studentName,
  userRole,
  branchId,
}: {
  studentId: string;
  studentName: string;
  userRole: UserRole;
  branchId?: string;
}) {
  const risk = await getStudentPerformanceRiskById(studentId, { branchId });
  if (!risk) return null;

  return (
    <StudentIntelligenceHub
      studentId={studentId}
      studentName={studentName}
      userRole={userRole}
      risk={risk}
    />
  );
}
