import { PortalShell } from "@/components/layout/portal-shell";
import { ChildTabs } from "@/components/parent/child-tabs";
import { NoChildrenMessage } from "@/components/parent/no-children";
import { LibraryBorrowerAccount } from "@/components/library/library-borrower-account";
import { auth } from "@/lib/auth";
import { PARENT_NAV } from "@/lib/nav/parent-nav";
import { getChildrenForParent } from "@/lib/services/parent";
import { getBorrowerLibraryAccount } from "@/lib/services/library-portal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { children } = await getChildrenForParent(session.user.id);
  if (children.length === 0) {
    return (
      <PortalShell title="Parent" nav={PARENT_NAV}>
        <NoChildrenMessage />
      </PortalShell>
    );
  }

  const params = await searchParams;
  const childId = params.childId ?? children[0].id;
  const child = children.find((c) => c.id === childId) ?? children[0];

  const student = await prisma.student.findUnique({
    where: { id: child.id },
    select: { userId: true, branchId: true },
  });

  const account =
    student?.userId && student.branchId
      ? await getBorrowerLibraryAccount(student.userId, student.branchId)
      : null;

  return (
    <PortalShell title="Parent" subtitle={`${child.firstName}'s library`} nav={PARENT_NAV}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Library — {child.firstName}</h1>
      <p className="mb-6 text-slate-500">Borrowed books, due dates, and fines for your child.</p>

      <ChildTabs linkedChildren={children} activeChildId={child.id} basePath="/parent/library" />

      {account ? (
        <LibraryBorrowerAccount account={account} />
      ) : (
        <p className="text-slate-500">
          No library account linked yet. Ask the registrar to link a student login.
        </p>
      )}
    </PortalShell>
  );
}
