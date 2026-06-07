import type { PlatformPaymentStatus, SchoolSignupStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORM_STUDENT_PRICE_ETB } from "@/lib/platform/billing";

export type PlatformPaymentClient = {
  id: string;
  amount: number;
  pricePerStudent: number;
  status: PlatformPaymentStatus;
  paidAt: string | null;
  chapaReference: string | null;
  txRef: string;
};

export type SchoolSignupClient = {
  id: string;
  schoolName: string;
  city: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  estimatedStudents: number;
  status: SchoolSignupStatus;
  createdAt: string;
  rejectionReason?: string | null;
  platformPayments?: PlatformPaymentClient[];
};

function serializePlatformPayment(payment: {
  id: string;
  amount: { toString(): string } | number | string;
  pricePerStudent: { toString(): string } | number | string;
  status: PlatformPaymentStatus;
  paidAt: Date | null;
  chapaReference: string | null;
  txRef: string;
}): PlatformPaymentClient {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    pricePerStudent: Number(payment.pricePerStudent),
    status: payment.status,
    paidAt: payment.paidAt?.toISOString() ?? null,
    chapaReference: payment.chapaReference,
    txRef: payment.txRef,
  };
}

export function serializeSchoolSignup(row: {
  id: string;
  schoolName: string;
  city: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  estimatedStudents: number;
  status: SchoolSignupStatus;
  createdAt: Date;
  rejectionReason?: string | null;
  platformPayments?: Array<{
    id: string;
    amount: { toString(): string } | number | string;
    pricePerStudent: { toString(): string } | number | string;
    status: PlatformPaymentStatus;
    paidAt: Date | null;
    chapaReference: string | null;
    txRef: string;
  }>;
}): SchoolSignupClient {
  return {
    id: row.id,
    schoolName: row.schoolName,
    city: row.city,
    contactEmail: row.contactEmail,
    contactFirstName: row.contactFirstName,
    contactLastName: row.contactLastName,
    estimatedStudents: row.estimatedStudents,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    rejectionReason: row.rejectionReason,
    platformPayments: row.platformPayments?.map(serializePlatformPayment),
  };
}

export async function getPlatformDashboardStats() {
  const [pendingSignups, approvedAwaitingPayment, paidAwaitingAccount, activeOrganizations, totalStudents] =
    await Promise.all([
      prisma.schoolSignupRequest.count({ where: { status: "PENDING" } }),
      prisma.schoolSignupRequest.count({ where: { status: "APPROVED" } }),
      prisma.schoolSignupRequest.count({ where: { status: "PAID" } }),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.student.count({ where: { isActive: true } }),
    ]);

  return {
    pendingSignups,
    approvedAwaitingPayment,
    paidAwaitingAccount,
    activeOrganizations,
    totalStudents,
    pricePerStudent: PLATFORM_STUDENT_PRICE_ETB,
  };
}

export async function getAllSchoolSignupsForClient(): Promise<SchoolSignupClient[]> {
  const rows = await prisma.schoolSignupRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      platformPayments: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  return rows.map(serializeSchoolSignup);
}

export async function getSchoolSignupById(id: string) {
  return prisma.schoolSignupRequest.findUnique({
    where: { id },
    include: {
      organization: true,
      platformPayments: { orderBy: { createdAt: "desc" } },
      reviewedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getActiveOrganizations() {
  return prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { branches: true, users: true } },
      signupRequest: {
        include: {
          platformPayments: {
            where: { status: "SUCCESS" },
            orderBy: { paidAt: "desc" },
            take: 1,
          },
        },
      },
      branches: {
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          isActive: true,
          _count: { select: { students: { where: { isActive: true } } } },
        },
      },
    },
  });
}
