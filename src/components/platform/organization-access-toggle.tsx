"use client";

import { useTransition } from "react";
import { activateOrganization, suspendOrganization } from "@/lib/actions/organization";

export function OrganizationAccessToggle({
  organizationId,
  isActive,
}: {
  organizationId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (isActive) await suspendOrganization(organizationId);
          else await activateOrganization(organizationId);
        })
      }
      className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Updating…" : isActive ? "Suspend access" : "Reactivate access"}
    </button>
  );
}
