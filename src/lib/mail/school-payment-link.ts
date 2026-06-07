import {
  PLATFORM_STUDENT_PRICE_ETB,
  calculatePlatformSubscriptionAmount,
} from "@/lib/platform/billing";
import { buildSchoolPaymentLink, sendMail } from "@/lib/mail/send";

type SchoolPaymentLinkEmailInput = {
  signupRequestId: string;
  schoolName: string;
  contactEmail: string;
  contactFirstName: string;
  estimatedStudents: number;
};

export async function sendSchoolPaymentLinkEmail(input: SchoolPaymentLinkEmailInput) {
  const paymentLink = buildSchoolPaymentLink(input.signupRequestId);
  const totalAmount = calculatePlatformSubscriptionAmount(input.estimatedStudents);
  const subject = `Pay to activate ${input.schoolName} on EduSync SMS`;

  const text = [
    `Hello ${input.contactFirstName},`,
    "",
    `Your school application for ${input.schoolName} has been approved.`,
    "",
    `Subscription: ${input.estimatedStudents} students × ${PLATFORM_STUDENT_PRICE_ETB} ETB = ${totalAmount.toLocaleString()} ETB`,
    "",
    `Pay securely with Chapa using this link:`,
    paymentLink,
    "",
    "After payment, you will receive super admin login details to create your branches.",
    "",
    "— EduSync SMS · Entro Ethiopia",
  ].join("\n");

  const html = `
    <p>Hello ${input.contactFirstName},</p>
    <p>Your school application for <strong>${input.schoolName}</strong> has been approved.</p>
    <p>
      Subscription:
      <strong>${input.estimatedStudents}</strong> students ×
      <strong>${PLATFORM_STUDENT_PRICE_ETB} ETB</strong> =
      <strong>${totalAmount.toLocaleString()} ETB</strong>
    </p>
    <p>
      <a href="${paymentLink}" style="display:inline-block;padding:12px 20px;background:#0d6960;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Pay with Chapa
      </a>
    </p>
    <p style="word-break:break-all;color:#555;">${paymentLink}</p>
    <p>After payment, sign in and set your password, then add your school branches from the admin portal.</p>
    <p>— EduSync SMS · Entro Ethiopia</p>
  `.trim();

  return sendMail({
    to: input.contactEmail,
    subject,
    text,
    html,
  });
}
