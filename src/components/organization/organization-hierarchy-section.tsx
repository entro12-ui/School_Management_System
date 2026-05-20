import { OrganizationHierarchy } from "@/components/organization/organization-hierarchy";
import { getOrganizationHierarchy } from "@/lib/services/organization";

type OrganizationHierarchySectionProps = {
  variant?: "marketing" | "admin" | "branch";
  highlightBranchId?: string;
  showPortalLinks?: boolean;
};

export async function OrganizationHierarchySection({
  variant = "marketing",
  highlightBranchId,
  showPortalLinks = true,
}: OrganizationHierarchySectionProps) {
  const data = await getOrganizationHierarchy();

  return (
    <OrganizationHierarchy
      branches={data.branches}
      centralAdmins={data.centralAdmins}
      highlightBranchId={highlightBranchId}
      variant={variant}
      showPortalLinks={showPortalLinks}
    />
  );
}
