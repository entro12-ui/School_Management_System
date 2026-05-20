/**
 * Copy HR module data from local Postgres → Render (does not touch students/payments).
 * Run: npm run db:sync-hr-to-render
 */
import { PrismaClient, UserRole } from "@prisma/client";

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ??
  "postgresql://postgres:password@localhost:5434/school_management?schema=school_sms";

const RENDER_URL = process.env.RENDER_DATABASE_URL;
if (!RENDER_URL) {
  console.error("Set RENDER_DATABASE_URL in .env.render");
  process.exit(1);
}

const local = new PrismaClient({
  datasources: { db: { url: LOCAL_URL } },
});

const render = new PrismaClient({
  datasources: { db: { url: RENDER_URL } },
});

function mapBranchId(
  localBranchId: string,
  branchIdMap: Map<string, string>
): string {
  const mapped = branchIdMap.get(localBranchId);
  if (!mapped) {
    throw new Error(`No Render branch mapping for local branch ${localBranchId}`);
  }
  return mapped;
}

function mapUserId(
  localUserId: string | null | undefined,
  userIdMap: Map<string, string>
): string | null | undefined {
  if (!localUserId) return localUserId;
  return userIdMap.get(localUserId) ?? localUserId;
}

async function upsertMany<T extends { id: string }>(
  label: string,
  rows: T[],
  upsert: (row: T) => Promise<unknown>
) {
  for (const row of rows) {
    await upsert(row);
  }
  console.log(`  ${label}: ${rows.length}`);
}

async function clearHrOnRender() {
  await render.$transaction([
    render.hrUserRole.deleteMany(),
    render.hrRolePermission.deleteMany(),
    render.hrCandidate.deleteMany(),
    render.hrAssetAssignment.deleteMany(),
    render.hrDisciplinaryAction.deleteMany(),
    render.hrTrainingEnrollment.deleteMany(),
    render.hrPerformanceReview.deleteMany(),
    render.hrPayrollRecord.deleteMany(),
    render.hrSalaryStructure.deleteMany(),
    render.hrLeaveRequest.deleteMany(),
    render.hrEmployeeAttendance.deleteMany(),
    render.hrEmployeeDocument.deleteMany(),
    render.hrEmployee.deleteMany(),
    render.hrJobPost.deleteMany(),
    render.hrAsset.deleteMany(),
    render.hrTraining.deleteMany(),
    render.hrLeaveType.deleteMany(),
    render.hrDesignation.deleteMany(),
    render.hrDepartment.deleteMany(),
    render.hrPermission.deleteMany(),
    render.hrRole.deleteMany(),
  ]);
}

/** Local branch id → Render branch id (match by id, then by unique code). */
async function buildBranchIdMap(localBranchIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const localId of localBranchIds) {
    const onRenderById = await render.branch.findUnique({ where: { id: localId } });
    if (onRenderById) {
      map.set(localId, onRenderById.id);
      continue;
    }

    const onLocal = await local.branch.findUnique({ where: { id: localId } });
    if (!onLocal) {
      throw new Error(`Branch ${localId} missing locally and on Render.`);
    }

    const onRenderByCode = await render.branch.findUnique({
      where: { code: onLocal.code },
    });
    if (onRenderByCode) {
      map.set(localId, onRenderByCode.id);
      console.log(
        `  Branch mapped by code ${onLocal.code}: ${localId.slice(0, 8)}… → ${onRenderByCode.id.slice(0, 8)}…`
      );
      continue;
    }

    const created = await render.branch.create({ data: onLocal });
    map.set(localId, created.id);
    console.log(`  Branch created on Render: ${onLocal.code}`);
  }

  return map;
}

async function syncHrUsers(
  branchIdMap: Map<string, string>,
  localUserIds: Set<string>
): Promise<Map<string, string>> {
  const userIdMap = new Map<string, string>();

  const users = await local.user.findMany({
    where: {
      OR: [{ role: UserRole.HR_OFFICER }, { id: { in: Array.from(localUserIds) } }],
    },
  });

  for (const u of users) {
    const renderBranchId = u.branchId
      ? mapBranchId(u.branchId, branchIdMap)
      : null;

    const existing = await render.user.findUnique({ where: { email: u.email } });

    if (existing) {
      userIdMap.set(u.id, existing.id);
      await render.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: u.passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          photoUrl: u.photoUrl,
          role: u.role,
          branchId: renderBranchId,
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
          pendingOtp: u.pendingOtp,
          otpIssuedAt: u.otpIssuedAt,
          lastLoginAt: u.lastLoginAt,
          updatedAt: u.updatedAt,
        },
      });
    } else {
      const created = await render.user.create({
        data: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          photoUrl: u.photoUrl,
          role: u.role,
          branchId: renderBranchId,
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
          pendingOtp: u.pendingOtp,
          otpIssuedAt: u.otpIssuedAt,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
      userIdMap.set(u.id, created.id);
    }
  }

  console.log(`  User (HR-related): ${users.length}`);
  return userIdMap;
}

async function main() {
  console.log("→ Reading HR data from local…");
  const [
    roles,
    permissions,
    rolePermissions,
    departments,
    designations,
    leaveTypes,
    trainings,
    assets,
    jobPosts,
    employees,
    documents,
    attendance,
    leaveRequests,
    salaries,
    payrolls,
    reviews,
    enrollments,
    assetAssignments,
    disciplinary,
    candidates,
    userRoles,
  ] = await Promise.all([
    local.hrRole.findMany(),
    local.hrPermission.findMany(),
    local.hrRolePermission.findMany(),
    local.hrDepartment.findMany(),
    local.hrDesignation.findMany(),
    local.hrLeaveType.findMany(),
    local.hrTraining.findMany(),
    local.hrAsset.findMany(),
    local.hrJobPost.findMany(),
    local.hrEmployee.findMany(),
    local.hrEmployeeDocument.findMany(),
    local.hrEmployeeAttendance.findMany(),
    local.hrLeaveRequest.findMany(),
    local.hrSalaryStructure.findMany(),
    local.hrPayrollRecord.findMany(),
    local.hrPerformanceReview.findMany(),
    local.hrTrainingEnrollment.findMany(),
    local.hrAssetAssignment.findMany(),
    local.hrDisciplinaryAction.findMany(),
    local.hrCandidate.findMany(),
    local.hrUserRole.findMany(),
  ]);

  const branchIds = Array.from(
    new Set([
      ...departments.map((d) => d.branchId),
      ...designations.map((d) => d.branchId),
      ...leaveTypes.map((l) => l.branchId),
      ...trainings.map((t) => t.branchId),
      ...assets.map((a) => a.branchId),
      ...jobPosts.map((j) => j.branchId),
      ...employees.map((e) => e.branchId),
    ])
  );

  const localUserIds = new Set<string>();
  for (const e of employees) {
    if (e.userId) localUserIds.add(e.userId);
  }
  for (const r of leaveRequests) {
    if (r.approverId) localUserIds.add(r.approverId);
  }
  for (const r of reviews) {
    if (r.reviewerId) localUserIds.add(r.reviewerId);
  }
  for (const ur of userRoles) {
    localUserIds.add(ur.userId);
  }

  console.log("→ Mapping branches (local id → Render id by code)…");
  const branchIdMap = await buildBranchIdMap(branchIds);

  console.log("→ Clearing existing HR rows on Render…");
  await clearHrOnRender();

  console.log("→ Copying HR tables to Render…");
  await upsertMany("HrRole", roles, (r) => render.hrRole.create({ data: r }));
  await upsertMany("HrPermission", permissions, (p) =>
    render.hrPermission.create({ data: p })
  );
  for (const rp of rolePermissions) {
    await render.hrRolePermission.create({ data: rp });
  }
  console.log(`  HrRolePermission: ${rolePermissions.length}`);

  await upsertMany("HrDepartment", departments, (d) =>
    render.hrDepartment.create({
      data: { ...d, branchId: mapBranchId(d.branchId, branchIdMap) },
    })
  );
  await upsertMany("HrDesignation", designations, (d) =>
    render.hrDesignation.create({
      data: { ...d, branchId: mapBranchId(d.branchId, branchIdMap) },
    })
  );
  await upsertMany("HrLeaveType", leaveTypes, (l) =>
    render.hrLeaveType.create({
      data: { ...l, branchId: mapBranchId(l.branchId, branchIdMap) },
    })
  );
  await upsertMany("HrTraining", trainings, (t) =>
    render.hrTraining.create({
      data: { ...t, branchId: mapBranchId(t.branchId, branchIdMap) },
    })
  );
  await upsertMany("HrAsset", assets, (a) =>
    render.hrAsset.create({
      data: { ...a, branchId: mapBranchId(a.branchId, branchIdMap) },
    })
  );
  await upsertMany("HrJobPost", jobPosts, (j) =>
    render.hrJobPost.create({
      data: { ...j, branchId: mapBranchId(j.branchId, branchIdMap) },
    })
  );

  const userIdMap = await syncHrUsers(branchIdMap, localUserIds);

  await upsertMany("HrEmployee", employees, (e) =>
    render.hrEmployee.create({
      data: {
        ...e,
        branchId: mapBranchId(e.branchId, branchIdMap),
        userId: mapUserId(e.userId, userIdMap) as string | null | undefined,
      },
    })
  );
  await upsertMany("HrEmployeeDocument", documents, (d) =>
    render.hrEmployeeDocument.create({ data: d })
  );
  await upsertMany("HrEmployeeAttendance", attendance, (a) =>
    render.hrEmployeeAttendance.create({ data: a })
  );
  await upsertMany("HrLeaveRequest", leaveRequests, (l) =>
    render.hrLeaveRequest.create({
      data: {
        ...l,
        approverId: mapUserId(l.approverId, userIdMap) as string | null | undefined,
      },
    })
  );
  await upsertMany("HrSalaryStructure", salaries, (s) =>
    render.hrSalaryStructure.create({ data: s })
  );
  await upsertMany("HrPayrollRecord", payrolls, (p) =>
    render.hrPayrollRecord.create({ data: p })
  );
  await upsertMany("HrPerformanceReview", reviews, (r) =>
    render.hrPerformanceReview.create({
      data: {
        ...r,
        reviewerId: mapUserId(r.reviewerId, userIdMap) as string | null | undefined,
      },
    })
  );
  await upsertMany("HrTrainingEnrollment", enrollments, (e) =>
    render.hrTrainingEnrollment.create({ data: e })
  );
  await upsertMany("HrAssetAssignment", assetAssignments, (a) =>
    render.hrAssetAssignment.create({ data: a })
  );
  await upsertMany("HrDisciplinaryAction", disciplinary, (d) =>
    render.hrDisciplinaryAction.create({ data: d })
  );
  await upsertMany("HrCandidate", candidates, (c) =>
    render.hrCandidate.create({ data: c })
  );
  for (const ur of userRoles) {
    const renderUserId = mapUserId(ur.userId, userIdMap);
    if (!renderUserId) continue;
    await render.hrUserRole.create({
      data: { userId: renderUserId, roleId: ur.roleId },
    });
  }
  console.log(`  HrUserRole: ${userRoles.length}`);

  const counts = await render.$queryRaw<
    { entity: string; count: bigint }[]
  >`SELECT 'HrEmployee' AS entity, COUNT(*)::bigint AS count FROM "HrEmployee"
    UNION ALL SELECT 'HrDepartment', COUNT(*)::bigint FROM "HrDepartment"
    UNION ALL SELECT 'User_HR', COUNT(*)::bigint FROM "User" WHERE role = 'HR_OFFICER'`;

  console.log("\n✓ HR data on Render:");
  for (const row of counts) {
    console.log(`  ${row.entity}: ${row.count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await local.$disconnect();
    await render.$disconnect();
  });
