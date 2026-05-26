import { auth } from "@/lib/auth";
import { getWeightedGradingSheet } from "@/lib/services/grading-weighted";
import { getSavedSingleAssessments } from "@/lib/services/single-assessment";
import {
  getClassesForTeacher,
  getStudentsForTeacherSubject,
  getTeacherByUserId,
} from "@/lib/services/teacher";
import { redirect } from "next/navigation";

export async function getGradingPageData(searchParams: {
  subjectId?: string;
  classId?: string;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const subjects = teacher.staffSubjects.map((s) => s.subject);
  const subjectIds = subjects.map((s) => s.id);

  const singleAssessmentsByClass = await getSavedSingleAssessments(
    teacher.branchId,
    subjectIds
  );

  const classesEntries = await Promise.all(
    subjects.map(async (subj) => {
      const classes = await getClassesForTeacher(teacher.branchId, subj.id);
      return { subjectId: subj.id, classes };
    })
  );

  const classesBySubject: Record<
    string,
    Awaited<ReturnType<typeof getClassesForTeacher>>
  > = {};
  const combos: { subjectId: string; classId: string }[] = [];

  for (const { subjectId, classes } of classesEntries) {
    classesBySubject[subjectId] = classes;
    for (const cls of classes) {
      combos.push({ subjectId, classId: cls.id });
    }
  }

  const comboResults = await Promise.all(
    combos.map(async ({ subjectId, classId }) => {
      const key = `${subjectId}:${classId}`;
      const [students, sheet] = await Promise.all([
        getStudentsForTeacherSubject(teacher.branchId, subjectId, classId, {
          light: true,
        }),
        getWeightedGradingSheet(teacher.id, teacher.branchId, subjectId, classId),
      ]);
      return { key, students, sheet };
    })
  );

  const studentsByClass: Record<
    string,
    Awaited<ReturnType<typeof getStudentsForTeacherSubject>>
  > = {};
  const initialSheets: Record<
    string,
    {
      components: Awaited<ReturnType<typeof getWeightedGradingSheet>>["components"];
      rows: { studentId: string; scores: Record<string, number | null> }[];
    }
  > = {};

  for (const { key, students, sheet } of comboResults) {
    studentsByClass[key] = students;
    initialSheets[key] = {
      components: sheet.components,
      rows: sheet.rows.map((r) => ({
        studentId: r.studentId,
        scores: r.scores,
      })),
    };
  }

  return {
    teacher,
    subjects,
    classesBySubject,
    studentsByClass,
    initialSheets,
    singleAssessmentsByClass,
    initialSubjectId: searchParams.subjectId,
    initialClassId: searchParams.classId,
  };
}
