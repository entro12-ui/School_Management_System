"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ClipboardCheck, ClipboardList, Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatGradeLevel } from "@/lib/grade-utils";
import type { TeacherClassSummary } from "@/lib/services/teacher";

function gradingHref(cls: TeacherClassSummary) {
  const subjectId = cls.mySubjects[0]?.id;
  if (!subjectId) return "/teacher/grading";
  return `/teacher/grading?subjectId=${subjectId}&classId=${cls.id}`;
}

export function TeacherClassesTable({ classes }: { classes: TeacherClassSummary[] }) {
  const columns = useMemo<DataTableColumn<TeacherClassSummary>[]>(
    () => [
      {
        id: "name",
        header: "Class",
        sortable: true,
        sortValue: (c) => c.name,
        cell: (c) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-900">{c.name}</span>
            {c.isHomeroom && (
              <span className="w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                My homeroom
              </span>
            )}
          </div>
        ),
      },
      {
        id: "grade",
        header: "Grade",
        sortable: true,
        sortValue: (c) => c.gradeLevel,
        cell: (c) => formatGradeLevel(c.gradeLevel),
      },
      {
        id: "year",
        header: "Year",
        sortable: true,
        sortValue: (c) => c.academicYear,
        cell: (c) => c.academicYear,
      },
      {
        id: "students",
        header: "Students",
        sortable: true,
        sortValue: (c) => c.studentCount,
        cell: (c) => (
          <span className="inline-flex items-center gap-1 text-slate-700">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {c.studentCount}
          </span>
        ),
      },
      {
        id: "mySubjects",
        header: "My subjects",
        sortable: true,
        sortValue: (c) => c.mySubjects.map((s) => s.name).join(", "),
        cell: (c) =>
          c.mySubjects.length > 0 ? (
            <span className="text-sm text-slate-600">
              {c.mySubjects.map((s) => s.name).join(", ")}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Homeroom only</span>
          ),
      },
      {
        id: "actions",
        header: "Quick actions",
        cell: (c) => (
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/teacher/students?classId=${c.id}`}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Users className="h-3 w-3" />
              Roster
            </Link>
            <Link
              href={`/teacher/attendance?classId=${c.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <ClipboardList className="h-3 w-3" />
              Attendance
            </Link>
            <Link
              href={gradingHref(c)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardCheck className="h-3 w-3" />
              Grading
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      data={classes}
      columns={columns}
      rowKey={(c) => c.id}
      searchPlaceholder="Search class, grade, subject…"
      getSearchText={(c) =>
        [
          c.name,
          formatGradeLevel(c.gradeLevel),
          c.academicYear,
          c.mySubjects.map((s) => s.name).join(" "),
          c.sectionSubjects.map((s) => s.name).join(" "),
        ].join(" ")
      }
      filters={[
        {
          id: "role",
          label: "Role",
          options: [
            { value: "all", label: "All classes" },
            { value: "homeroom", label: "My homeroom" },
            { value: "teaching", label: "Subject teaching" },
          ],
          predicate: (c, value) => {
            if (value === "homeroom") return c.isHomeroom;
            if (value === "teaching") return c.mySubjects.length > 0;
            return true;
          },
        },
      ]}
      pageSize={12}
      emptyMessage="No classes match your filters."
      recordLabel="class"
    />
  );
}
