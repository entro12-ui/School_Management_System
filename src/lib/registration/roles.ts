import { RegistrationRole } from "@prisma/client";

export const REGISTRATION_ROLE_LABELS: Record<RegistrationRole, string> = {
  REGISTRAR: "Registrar office applicant",
  HR_MANAGER: "HR Manager applicant",
};
