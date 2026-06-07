import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | EduSync SMS",
  description:
    "How EduSync SMS collects, uses, and protects student, parent, and staff data on behalf of subscribing schools.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 2026"
      intro="This Privacy Policy explains how EduSync SMS, operated by Entro Ethiopia Software Development PLC, handles personal data. Schools are the data controllers of their information; EduSync SMS acts as a data processor on their behalf."
      sections={[
        {
          heading: "Data we process",
          body: [
            "On behalf of subscribing schools we process information such as student records, attendance, grades, fees, library activity, HR records, and account details for staff, parents, and students.",
            "We collect only the data needed to deliver school management features and to keep accounts secure.",
          ],
        },
        {
          heading: "How data is used",
          body: [
            "Data is used to provide the platform's features — academics, finance, library, HR, communication, and analytics — and to support, secure, and improve the service.",
            "We do not sell personal data, and we do not use student data for advertising.",
          ],
        },
        {
          heading: "AI features",
          body: [
            "Optional AI features (such as the AI Study Tutor and parent communication assistant) process the minimum content needed to generate a response. Schools can enable or disable these features.",
          ],
        },
        {
          heading: "Data security",
          body: [
            "We apply role-based access control, encrypted authentication, audit logging, and other safeguards to protect data. Access is limited to authorized users within each school.",
          ],
        },
        {
          heading: "Data retention",
          body: [
            "We retain data for as long as a school's account is active or as required to provide the service and meet legal obligations. Schools may request export or deletion of their data in line with their service agreement.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Students, parents, and staff should direct requests about their personal data to their school administrator, who can act through the platform or contact us for assistance.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For privacy questions, contact entro12@entroethiopia.com or visit https://www.entroethiopia.com.",
          ],
        },
      ]}
    />
  );
}
