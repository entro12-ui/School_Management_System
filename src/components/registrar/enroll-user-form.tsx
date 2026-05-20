"use client";

import { useState, useTransition } from "react";
import { GradeBand, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { StudentFields } from "@/components/registration/student-fields";
import { DepartmentSelect } from "@/components/registration/department-select";
import { TeacherSubjectPicker } from "@/components/registration/teacher-subject-picker";
import { TEACHER_DEPARTMENTS } from "@/lib/academic-catalog";
import { enrollUser } from "@/lib/actions/enrollment";
import { ENROLL_PHOTO_ROLES, enrollRoleLabel } from "@/lib/enrollment/enrollable-roles";

type Branch = { id: string; name: string; city: string };
type Subject = { id: string; name: string; code: string; gradeBand: GradeBand };

export function EnrollUserForm({
  branches,
  subjects,
  defaultBranchId,
  showBranchPicker,
  allowedRoles,
}: {
  branches: Branch[];
  subjects: Subject[];
  defaultBranchId?: string;
  showBranchPicker: boolean;
  allowedRoles: UserRole[];
}) {
  const defaultRole = allowedRoles[0] ?? UserRole.STUDENT;
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [teacherDepartment, setTeacherDepartment] = useState<string>(
    TEACHER_DEPARTMENTS[0]?.value ?? "Junior High (6–8)"
  );
  const [otpResult, setOtpResult] = useState<{
    email: string;
    oneTimePassword: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const showPhoto = ENROLL_PHOTO_ROLES.has(role);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOtpResult(null);
    const formData = new FormData(e.currentTarget);
    formData.set("role", role);
    if (role === UserRole.HR_OFFICER) {
      const grantManager = (e.currentTarget.elements.namedItem("asHrManager") as
        | HTMLInputElement
        | null)?.checked;
      formData.set("asHrManager", grantManager ? "true" : "false");
    }

    startTransition(async () => {
      const result = await enrollUser(formData);
      if (result.success && result.data) {
        setOtpResult({
          email: result.data.email,
          oneTimePassword: result.data.oneTimePassword,
          name: formData.get("firstName") + " " + formData.get("lastName"),
        });
        (e.target as HTMLFormElement).reset();
        setRole(defaultRole);
      } else if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {otpResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">Account created — share one-time password</p>
          <p className="mt-1 text-sm text-emerald-800">
            {otpResult.name} ({otpResult.email})
          </p>
          <p className="mt-3 font-mono text-2xl font-bold tracking-widest text-emerald-900">
            {otpResult.oneTimePassword}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            They sign in with this password once, then must set a new password. This code is also
            listed on the enrollment sheet.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        {showBranchPicker && (
          <Field label="Branch *">
            <Select name="branchId" required defaultValue={defaultBranchId ?? ""}>
              <option value="" disabled>
                Select branch
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.city}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {!showBranchPicker && defaultBranchId && (
          <input type="hidden" name="branchId" value={defaultBranchId} />
        )}

        <Field label="Role to enroll *">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            name="roleDisplay"
          >
            {allowedRoles.map((r) => (
              <option key={r} value={r}>
                {enrollRoleLabel(r)}
              </option>
            ))}
          </Select>
        </Field>

        {role === UserRole.HR_OFFICER && (
          <label className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-indigo-950">
            <input
              type="checkbox"
              name="asHrManager"
              defaultChecked
              className="mt-0.5"
            />
            <span>
              <strong>HR Manager</strong> — full HR module access (employees, payroll, leave).
              Uncheck for a limited HR Officer account without manager permissions.
            </span>
          </label>
        )}

        {(role === UserRole.REGISTRAR || role === UserRole.BRANCH_ADMIN) && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Creates a portal login immediately. No separate online application is required.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name *">
            <Input name="firstName" required />
          </Field>
          <Field label="Last name *">
            <Input name="lastName" required />
          </Field>
        </div>

        <Field label="Email *">
          <Input name="email" type="email" required />
        </Field>

        <Field label="Phone">
          <Input name="phone" type="tel" />
        </Field>

        {showPhoto && (
          <Field label="Staff photo">
            <div className="flex flex-wrap items-center gap-4">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200"
                />
              )}
              <Input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="max-w-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setPhotoPreview(null);
                    return;
                  }
                  const url = URL.createObjectURL(file);
                  setPhotoPreview(url);
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Optional. JPEG, PNG, or WebP, max 2 MB. Shown in the portal header after login.
            </p>
          </Field>
        )}

        {role === UserRole.STUDENT && <StudentFields />}

        {role === UserRole.TEACHER && (
          <>
            <DepartmentSelect
              role={UserRole.TEACHER}
              value={teacherDepartment}
              onChange={setTeacherDepartment}
            />
            <TeacherSubjectPicker subjects={subjects} department={teacherDepartment} />
          </>
        )}

        {role === UserRole.FINANCE_OFFICER && (
          <DepartmentSelect role={UserRole.FINANCE_OFFICER} required={false} />
        )}

        {role === UserRole.LIBRARIAN && (
          <DepartmentSelect role={UserRole.LIBRARIAN} required={false} />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Create account & generate OTP"}
        </Button>
      </form>
    </div>
  );
}
