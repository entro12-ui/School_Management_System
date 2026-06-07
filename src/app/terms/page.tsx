import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | EduSync SMS",
  description:
    "Terms of Service governing access to and use of the EduSync SMS school management platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 2026"
      intro="These Terms of Service govern your access to and use of EduSync SMS, a school management platform provided by Entro Ethiopia Software Development PLC. By accessing or using the platform, your institution agrees to these terms."
      sections={[
        {
          heading: "Agreement",
          body: [
            "EduSync SMS is licensed, not sold. Access is provided to subscribing schools and their authorized users under an active subscription or service agreement.",
            "By using the platform you confirm that you are authorized to act on behalf of your institution and to accept these terms.",
          ],
        },
        {
          heading: "Accounts and access",
          body: [
            "Accounts are issued by your institution's administrators or registrar. Each user is responsible for keeping their credentials confidential and for all activity under their account.",
            "We may suspend or revoke access that violates these terms, threatens platform security, or is used for unlawful purposes.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "You agree not to misuse the platform, including attempting to gain unauthorized access, disrupting service, reverse engineering, or copying the software or its content.",
            "Student, parent, and staff data must only be used for legitimate educational and administrative purposes.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "All software, design, content, and trademarks in EduSync SMS are the exclusive property of Entro Ethiopia Software Development PLC and are protected by applicable law. No rights are granted except the limited right to use the platform under an active subscription.",
          ],
        },
        {
          heading: "Service availability",
          body: [
            "We strive to keep the platform available and secure but do not guarantee uninterrupted service. Planned maintenance and service levels are described in your institution's service agreement.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "The platform is provided on a commercially reasonable basis. To the maximum extent permitted by law, Entro Ethiopia Software Development PLC is not liable for indirect or consequential damages arising from use of the platform.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about these terms can be sent to entro12@entroethiopia.com or via https://www.entroethiopia.com.",
          ],
        },
      ]}
    />
  );
}
