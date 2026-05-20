import nodemailer from "nodemailer";
import { getEnv } from "./env";
import { CONTACT_EMAIL } from "../site-config";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function detailsByEveningBlock(itemKind: "course" | "event"): string {
  const label = itemKind === "course" ? "course" : "event";
  return `<p style="margin:1.25rem 0;padding:0.875rem 1rem;background:#f4f7fb;border-left:3px solid #0ea5e9;border-radius:4px;">
      <strong>What happens next</strong><br />
      Thank you for registering. You will receive full ${label} details by email this evening, including schedule, joining instructions, and any links you need.
    </p>`;
}

export async function sendOtpEmail(email: string, code: string) {
  const env = getEnv();
  await getTransporter().sendMail({
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
      ? `Registration confirmed — ${input.itemTitle}`
      : `Enrollment confirmed — ${input.itemTitle}`;

  const env = getEnv();
  await getTransporter().sendMail({
    from: env.GMAIL_USER,
    to: input.to,
    replyTo: CONTACT_EMAIL,
    subject,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#1a1a1a;">
      <h2 style="margin-top:0;color:#111;">Thank you for registering</h2>
      <p>Hi ${input.name},</p>
      <p>Your registration for <strong>${input.itemTitle}</strong> (${kind}) is confirmed.</p>
      ${feeSection}
      <p><strong>Reference:</strong> ${input.orderRef}</p>
      ${detailsByEveningBlock(input.itemKind)}
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
  const env = getEnv();
  await getTransporter().sendMail({
    from: env.GMAIL_USER,
    to: input.to,
    replyTo: CONTACT_EMAIL,
    subject: `Registration received — ${input.itemTitle}`,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#1a1a1a;">
      <h2 style="margin-top:0;color:#111;">Registration received</h2>
      <p>Hi ${input.name},</p>
      <p>Thank you for registering for <strong>${input.itemTitle}</strong> (${kind}).</p>
      <p><strong>Amount due:</strong> INR ${input.amount}</p>
      <p>Please return to Cloud Vaathi and complete payment on the registration page to confirm your seat.</p>
      ${detailsByEveningBlock(input.itemKind)}
      <p style="margin-top:1.5rem;color:#555;font-size:14px;">Need help? ${CONTACT_EMAIL}</p>
    </div>`,
  });
}
