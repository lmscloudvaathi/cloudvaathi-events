import { z } from "zod";

export const SIGNUP_PASSWORD_MIN_MESSAGE =
  "Your password must be at least 8 characters long. Please choose a stronger password to keep your account secure.";

export const signUpSchema = z.object({
  name: z.string().min(2, "Please enter your full name (at least 2 characters)."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(8, "Please enter a valid WhatsApp number (at least 8 digits).").max(20, "Phone number is too long."),
  password: z.string().min(8, SIGNUP_PASSWORD_MIN_MESSAGE),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, SIGNUP_PASSWORD_MIN_MESSAGE),
});

export const createOrderSchema = z.object({
  token: z.string().min(1),
  itemType: z.enum(["course", "event"]),
  itemSlug: z.string().min(1),
  couponCode: z.string().max(64).optional(),
});

export const validateCouponSchema = z.object({
  token: z.string().min(1),
  itemType: z.enum(["course", "event"]),
  itemSlug: z.string().min(1),
  couponCode: z.string().min(1).max(64),
});

export const confirmPaymentSchema = z.object({
  token: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** First user-facing message from a Zod validation failure. */
export function firstZodIssueMessage(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Please check your details and try again.";
}
