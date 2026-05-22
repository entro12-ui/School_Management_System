import {
  PrismaClient,
  UserRole,
  GradeBand,
  LibraryBorrowerType,
  SeniorStream,
  AttendanceStatus,
  PaymentStatus,
  AssessmentType,
  AcademicTerm,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { SUBJECT_CATALOG } from "../src/lib/academic-catalog";
import {
  DEFAULT_SEMESTER_AMOUNTS,
  feeStructureName,
  GRADE_BAND_ORDER,
} from "../src/lib/fee-structures";

const prisma = new PrismaClient();
const password = "demo1234";
const hash = () => bcrypt.hash(password, 10);

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.libraryReadingLog.deleteMany();
  await prisma.libraryFine.deleteMany();
  await prisma.bookReservation.deleteMany();
  await prisma.bookIssue.deleteMany();
  await prisma.book.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.gpaRecord.deleteMany();
  await prisma.registrationRequest.deleteMany();
  await prisma.staffSubject.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const branchAddis = await prisma.branch.create({
    data: {
      code: "ADDIS",
      name: "Branch A — Addis Ababa",
      city: "Addis Ababa",
      address: "Bole, Addis Ababa",
      phone: "+251-11-000-0001",
    },
  });

  const branchBishoftu = await prisma.branch.create({
    data: {
      code: "BISH",
      name: "Branch B — Bishoftu",
      city: "Bishoftu",
      address: "Main Road, Bishoftu",
      phone: "+251-11-000-0002",
    },
  });

  const yearAddis = await prisma.academicYear.create({
    data: {
      branchId: branchAddis.id,
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  const yearBish = await prisma.academicYear.create({
    data: {
      branchId: branchBishoftu.id,
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@school.et",
      passwordHash: await hash(),
      firstName: "Central",
      lastName: "Administrator",
      role: UserRole.SUPER_ADMIN,
    },
  });

  const adminAddis = await prisma.user.create({
    data: {
      email: "admin.addis@school.et",
      passwordHash: await hash(),
      firstName: "Selam",
      lastName: "Bekele",
      role: UserRole.BRANCH_ADMIN,
      branchId: branchAddis.id,
    },
  });

  const adminBish = await prisma.user.create({
    data: {
      email: "admin.bishoftu@school.et",
      passwordHash: await hash(),
      firstName: "Dawit",
      lastName: "Tesfaye",
      role: UserRole.BRANCH_ADMIN,
      branchId: branchBishoftu.id,
    },
  });

  const registrarAddis = await prisma.user.create({
    data: {
      email: "registrar.addis@school.et",
      passwordHash: await hash(),
      firstName: "Tigist",
      lastName: "Alemu",
      role: UserRole.REGISTRAR,
      branchId: branchAddis.id,
      mustChangePassword: false,
    },
  });

  const teacherAddis = await prisma.user.create({
    data: {
      email: "teacher.addis@school.et",
      passwordHash: await hash(),
      firstName: "Meron",
      lastName: "Haile",
      role: UserRole.TEACHER,
      branchId: branchAddis.id,
    },
  });

  const financeAddis = await prisma.user.create({
    data: {
      email: "finance.addis@school.et",
      passwordHash: await hash(),
      firstName: "Hanna",
      lastName: "Girma",
      role: UserRole.FINANCE_OFFICER,
      branchId: branchAddis.id,
    },
  });

  const librarianAddis = await prisma.user.create({
    data: {
      email: "library.addis@school.et",
      passwordHash: await hash(),
      firstName: "Yonas",
      lastName: "Kebede",
      role: UserRole.LIBRARIAN,
      branchId: branchAddis.id,
    },
  });

  const hrAddis = await prisma.user.create({
    data: {
      email: "hr.addis@school.et",
      passwordHash: await hash(),
      firstName: "Selam",
      lastName: "Tadesse",
      role: UserRole.HR_OFFICER,
      branchId: branchAddis.id,
    },
  });

  const teacherBish = await prisma.user.create({
    data: {
      email: "teacher.bishoftu@school.et",
      passwordHash: await hash(),
      firstName: "Sara",
      lastName: "Mulugeta",
      role: UserRole.TEACHER,
      branchId: branchBishoftu.id,
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: "parent@school.et",
      passwordHash: await hash(),
      firstName: "Abebe",
      lastName: "Kebede",
      role: UserRole.PARENT,
      branchId: branchAddis.id,
    },
  });

  const parentProfile = await prisma.parentProfile.create({
    data: { userId: parentUser.id },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: "student@school.et",
      passwordHash: await hash(),
      firstName: "Lidya",
      lastName: "Abebe",
      role: UserRole.STUDENT,
      branchId: branchAddis.id,
    },
  });

  const studentGrade10User = await prisma.user.create({
    data: {
      email: "student.grade10@school.et",
      passwordHash: await hash(),
      firstName: "Daniel",
      lastName: "Tadesse",
      role: UserRole.STUDENT,
      branchId: branchBishoftu.id,
      mustChangePassword: false,
    },
  });

  await prisma.staffProfile.createMany({
    data: [
      {
        userId: teacherAddis.id,
        branchId: branchAddis.id,
        employeeId: "T-ADD-001",
        department: "Primary (KG–5)",
      },
      {
        userId: financeAddis.id,
        branchId: branchAddis.id,
        employeeId: "F-ADD-001",
        department: "Finance",
      },
      {
        userId: librarianAddis.id,
        branchId: branchAddis.id,
        employeeId: "L-ADD-001",
        department: "Library",
      },
      {
        userId: teacherBish.id,
        branchId: branchBishoftu.id,
        employeeId: "T-BISH-001",
        department: "Senior High (6–12)",
      },
    ],
  });

  const kgClass = await prisma.class.create({
    data: {
      branchId: branchAddis.id,
      academicYearId: yearAddis.id,
      name: "KG-A",
      gradeLevel: 0,
      gradeBand: GradeBand.KG,
    },
  });

  const grade10Class = await prisma.class.create({
    data: {
      branchId: branchBishoftu.id,
      academicYearId: yearBish.id,
      name: "Grade 10 — Natural",
      gradeLevel: 10,
      gradeBand: GradeBand.SENIOR_HIGH,
      stream: SeniorStream.NATURAL_SCIENCE,
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      branchId: branchAddis.id,
      classId: kgClass.id,
      studentId: "STU-2025-001",
      firstName: "Lidya",
      lastName: "Abebe",
      gradeBand: GradeBand.KG,
      gradeLevel: 0,
      guardianId: parentProfile.id,
    },
  });

  await prisma.student.create({
    data: {
      userId: studentGrade10User.id,
      branchId: branchBishoftu.id,
      classId: grade10Class.id,
      studentId: "STU-DEMO-002",
      firstName: "Daniel",
      lastName: "Tadesse",
      gradeBand: GradeBand.SENIOR_HIGH,
      gradeLevel: 10,
      stream: SeniorStream.NATURAL_SCIENCE,
    },
  });

  const subjects = await Promise.all(
    SUBJECT_CATALOG.map((s) =>
      prisma.subject.create({
        data: {
          code: s.code,
          name: s.name,
          gradeBand: s.gradeBand,
          isCore: true,
        },
      })
    )
  );

  const mathSubject = subjects.find((s) => s.code === "SH-MATH")!;
  const engPrimary = subjects.find((s) => s.code === "PRI-ENG")!;
  const kgPlay = subjects.find((s) => s.code === "KG-PLAY")!;

  const teacherStaff = await prisma.staffProfile.findFirst({
    where: { userId: teacherAddis.id },
  });

  if (teacherStaff) {
    await prisma.staffSubject.createMany({
      data: [
        { staffId: teacherStaff.id, subjectId: engPrimary.id },
        { staffId: teacherStaff.id, subjectId: kgPlay.id },
      ],
    });
    await prisma.subject.update({
      where: { id: engPrimary.id },
      data: { teacherId: teacherStaff.id },
    });
  }

  const grade1Class = await prisma.class.create({
    data: {
      branchId: branchAddis.id,
      academicYearId: yearAddis.id,
      name: "Grade 1-A",
      gradeLevel: 1,
      gradeBand: GradeBand.PRIMARY,
    },
  });

  await prisma.classSubject.createMany({
    data: [
      { classId: kgClass.id, subjectId: kgPlay.id },
      { classId: grade1Class.id, subjectId: engPrimary.id },
      {
        classId: grade1Class.id,
        subjectId: subjects.find((s) => s.code === "PRI-MATH")!.id,
      },
      { classId: grade10Class.id, subjectId: mathSubject.id },
    ],
  });

  await prisma.student.create({
    data: {
      branchId: branchAddis.id,
      classId: grade1Class.id,
      studentId: "STU-2025-003",
      firstName: "Sara",
      lastName: "Tesfaye",
      gradeBand: GradeBand.PRIMARY,
      gradeLevel: 1,
    },
  });

  const assessment = await prisma.assessment.create({
    data: {
      classId: grade10Class.id,
      subjectId: mathSubject.id,
      title: "Midterm Exam",
      type: AssessmentType.MIDTERM,
      term: AcademicTerm.TERM_1,
      maxScore: 100,
    },
  });

  async function seedBandSemesterFees(branchId: string) {
    for (const band of GRADE_BAND_ORDER) {
      for (const term of [AcademicTerm.SEMESTER_1, AcademicTerm.SEMESTER_2] as const) {
        await prisma.feeStructure.create({
          data: {
            branchId,
            name: feeStructureName(band, term),
            gradeBand: band,
            term,
            amount: DEFAULT_SEMESTER_AMOUNTS[band],
          },
        });
      }
    }
  }

  await seedBandSemesterFees(branchAddis.id);
  await seedBandSemesterFees(branchBishoftu.id);

  const feeSem1 = await prisma.feeStructure.findFirstOrThrow({
    where: {
      branchId: branchAddis.id,
      gradeBand: GradeBand.KG,
      term: AcademicTerm.SEMESTER_1,
    },
  });

  await prisma.payment.create({
    data: {
      branchId: branchAddis.id,
      studentId: student.id,
      academicYearId: yearAddis.id,
      term: AcademicTerm.SEMESTER_1,
      feeStructureId: feeSem1.id,
      amount: 22500,
      paidAmount: 22500,
      status: PaymentStatus.PAID,
      dueDate: new Date("2025-09-01"),
      paidAt: new Date("2025-09-15"),
      reference: "SEED-S1",
    },
  });

  await prisma.payment.create({
    data: {
      branchId: branchAddis.id,
      studentId: student.id,
      academicYearId: yearAddis.id,
      term: AcademicTerm.SEMESTER_2,
      amount: 22500,
      paidAmount: 10000,
      status: PaymentStatus.PARTIAL,
      dueDate: new Date("2026-02-01"),
      notes: "KG Semester 2 tuition",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendanceRecord.create({
    data: {
      branchId: branchAddis.id,
      classId: kgClass.id,
      studentId: student.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      method: "manual",
    },
  });

  const bookMath = await prisma.book.create({
    data: {
      branchId: branchAddis.id,
      title: "Ethiopian National Curriculum — Grade 5 Math",
      author: "MoE",
      category: "Textbook",
      subject: "Mathematics",
      gradeBand: GradeBand.PRIMARY,
      barcode: "BK-MATH-G5-001",
      shelfLocation: "A-12",
      totalCopies: 30,
      available: 28,
    },
  });

  await prisma.book.createMany({
    data: [
      {
        branchId: branchAddis.id,
        title: "English Reader — Grade 5",
        author: "MoE",
        category: "Textbook",
        subject: "Language",
        gradeBand: GradeBand.PRIMARY,
        barcode: "BK-ENG-G5-001",
        shelfLocation: "B-04",
        totalCopies: 25,
        available: 24,
      },
      {
        branchId: branchAddis.id,
        title: "Science Discovery (Reference)",
        author: "Pearson",
        category: "Reference",
        subject: "Science",
        gradeBand: GradeBand.JUNIOR_HIGH,
        barcode: "BK-SCI-REF-001",
        totalCopies: 10,
        available: 10,
      },
      {
        branchId: branchAddis.id,
        title: "Digital Encyclopedia — Primary",
        author: "EduSync",
        category: "Digital",
        isDigital: true,
        digitalUrl: "https://simple.wikipedia.org/wiki/Main_Page",
        gradeBand: GradeBand.PRIMARY,
        totalCopies: 1,
        available: 1,
      },
      {
        branchId: branchAddis.id,
        title: "Picture Book — ABC Animals",
        author: "Kids Press",
        category: "Picture book",
        gradeBand: GradeBand.KG,
        barcode: "BK-KG-ABC-001",
        shelfLocation: "KG-01",
        totalCopies: 15,
        available: 15,
      },
    ],
  });

  const dueSoon = new Date();
  dueSoon.setDate(dueSoon.getDate() + 7);
  await prisma.bookIssue.create({
    data: {
      branchId: branchAddis.id,
      bookId: bookMath.id,
      borrowerUserId: studentUser.id,
      borrowerType: LibraryBorrowerType.STUDENT,
      studentId: student.id,
      dueDate: dueSoon,
      notes: "Demo loan — return via librarian portal",
    },
  });
  await prisma.book.update({
    where: { id: bookMath.id },
    data: { available: 27 },
  });

  await prisma.announcement.create({
    data: {
      title: "Welcome to 2025/2026 Academic Year",
      body: "All branches are now synced in real time. Parent portals are live.",
      audience: "ALL",
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: "schoolName", value: "EduSync SMS" },
      { key: "defaultCountry", value: "Ethiopia" },
      { key: "academicCalendar", value: "September – June" },
      { key: "otpExpiryDays", value: 7 },
      { key: "requirePasswordChange", value: true },
      { key: "smsNotifications", value: false },
      { key: "smsSenderId", value: "EDUSYNC" },
      { key: "smsProvider", value: "none" },
    ],
    skipDuplicates: true,
  });

  await seedHrModule(branchAddis.id, hrAddis.id);

  await prisma.auditLog.create({
    data: {
      actorId: superAdmin.id,
      action: "SYSTEM_SEED",
      entity: "System",
      metadata: { branches: 2, demoUsers: 10 },
    },
  });

  console.log("Seed complete. Demo password for all users:", password);
  console.log({
    superAdmin: superAdmin.email,
    branchAdmins: [adminAddis.email, adminBish.email],
    teacher: teacherAddis.email,
    finance: financeAddis.email,
    librarian: librarianAddis.email,
    hr: hrAddis.email,
    parent: parentUser.email,
    student: studentUser.email,
    studentGrade10: studentGrade10User.email,
  });
}

async function seedHrModule(branchId: string, hrUserId: string) {
  const { ensureHrRbacDefaults } = await import("../src/lib/services/hr");
  await ensureHrRbacDefaults();

  const deptAdmin = await prisma.hrDepartment.create({
    data: {
      branchId,
      name: "Administration",
      description: "School office and operations",
    },
  });
  const deptAcademic = await prisma.hrDepartment.create({
    data: { branchId, name: "Academic", description: "Teaching staff support" },
  });

  const desigManager = await prisma.hrDesignation.create({
    data: { branchId, title: "HR Manager", salaryGrade: "G7" },
  });
  const desigOfficer = await prisma.hrDesignation.create({
    data: { branchId, title: "HR Officer", salaryGrade: "G5" },
  });

  await prisma.hrLeaveType.createMany({
    data: [
      { branchId, name: "Annual leave", maxDays: 20 },
      { branchId, name: "Sick leave", maxDays: 10 },
      { branchId, name: "Maternity", maxDays: 90 },
    ],
  });

  const emp1 = await prisma.hrEmployee.create({
    data: {
      branchId,
      departmentId: deptAdmin.id,
      designationId: desigManager.id,
      employeeCode: "HR-001",
      firstName: "Selam",
      lastName: "Tadesse",
      email: "hr.addis@school.et",
      phone: "+251911000001",
      joiningDate: new Date("2022-09-01"),
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      userId: hrUserId,
    },
  });

  const emp2 = await prisma.hrEmployee.create({
    data: {
      branchId,
      departmentId: deptAcademic.id,
      designationId: desigOfficer.id,
      employeeCode: "HR-002",
      firstName: "Daniel",
      lastName: "Mekonnen",
      email: "daniel.hr@school.et",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
    },
  });

  await prisma.hrSalaryStructure.create({
    data: {
      employeeId: emp1.id,
      baseSalary: 45000,
      allowances: 5000,
      taxPercentage: 15,
      pensionPercentage: 7,
    },
  });

  const training = await prisma.hrTraining.create({
    data: {
      branchId,
      title: "Child safeguarding",
      description: "Mandatory annual training",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.hrTrainingEnrollment.create({
    data: {
      trainingId: training.id,
      employeeId: emp1.id,
      status: "IN_PROGRESS",
      completionPercentage: 40,
    },
  });

  const job = await prisma.hrJobPost.create({
    data: {
      branchId,
      departmentId: deptAcademic.id,
      title: "Primary English Teacher",
      description: "Grades 4–6 English instruction",
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "OPEN",
    },
  });

  await prisma.hrCandidate.create({
    data: {
      jobPostId: job.id,
      fullName: "Marta Lemma",
      email: "marta.candidate@school.et",
      aiScore: 82.5,
      status: "SHORTLISTED",
    },
  });

  const hrManagerRole = await prisma.hrRole.upsert({
    where: { name: "HR Manager" },
    create: { name: "HR Manager", description: "Full control of HR module" },
    update: {},
  });

  await prisma.hrUserRole.upsert({
    where: { userId_roleId: { userId: hrUserId, roleId: hrManagerRole.id } },
    create: { userId: hrUserId, roleId: hrManagerRole.id },
    update: {},
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
