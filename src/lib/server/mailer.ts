import nodemailer from "nodemailer";
import { getEnv } from "./env";
import { CONTACT_EMAIL } from "../site-config";

const env = getEnv();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(email: string, code: string) {
  await transporter.sendMail({
    from: env.GMAIL_USER,
    to: email,
    subject: "Cloud Vaathi OTP Verification",
    text: `Your Cloud Vaathi OTP is ${code}. It expires in 10 minutes.`,
  });
}

/** Sent when registration is complete (free enrollments or after successful payment). */
export async function sendEnrollmentConfirmationEmail(input: {
  to: string;
  name: string;
  itemTitle: string;
  itemKind: "course" | "event";
  amount: number;
  orderRef: string;
  paymentId?: string;
}) {
  const kind = input.itemKind === "course" ? "Course" : "Event";
  const feeSection =
    input.amount <= 0
      ? `<p><strong>Fee:</strong> Free — no payment required.</p>`
      : `<p><strong>Amount paid:</strong> INR ${input.amount}</p>${
          input.paymentId ? `<p><strong>Payment ID:</strong> ${input.paymentId}</p>` : ""
        }`;

  const subject =
    input.amount <= 0
      ? `You're enrolled — ${input.itemTitle}`
      : `Enrollment confirmed — ${input.itemTitle}`;

  await transporter.sendMail({
    from: env.GMAIL_USER,
    to: input.to,
    replyTo: CONTACT_EMAIL,
    subject,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.5;">
      <h2 style="margin-top:0;">${input.amount <= 0 ? "Enrollment confirmed" : "You're enrolled"}</h2>
      <p>Hi ${input.name},</p>
      <p><strong>${kind}:</strong> ${input.itemTitle}</p>
      ${feeSection}
      <p><strong>Reference:</strong> ${input.orderRef}</p>
      <p style="margin-top:1.5rem;color:#555;font-size:14px;">Questions? Reply to this email or write to ${CONTACT_EMAIL}.</p>
    </div>`,
  });
}

/** Sent after step 1 register when payment is still required. */
export async function sendRegistrationPendingEmail(input: {
  to: string;
  name: string;
  itemTitle: string;
  itemKind: "course" | "event";
  amount: number;
}) {
  const kind = input.itemKind === "course" ? "course" : "event";
  await transporter.sendMail({
    from: env.GMAIL_USER,
    to: input.to,
    replyTo: CONTACT_EMAIL,
    subject: `Complete payment — ${input.itemTitle}`,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.5;">
      <p>Hi ${input.name},</p>
      <p>We received your registration for <strong>${input.itemTitle}</strong> (${kind}).</p>
      <p><strong>Amount due:</strong> INR ${input.amount}</p>
      <p>Return to Cloud Vaathi and complete payment on the registration page to confirm your seat.</p>
      <p style="margin-top:1rem;color:#555;font-size:14px;">Need help? ${CONTACT_EMAIL}</p>
    </div>`,
  });
}
