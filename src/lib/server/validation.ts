import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Please enter your full name (at least 2 characters)."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(8, "Please enter a valid WhatsApp number (at least 8 digits).").max(20, "Phone number is too long."),
  password: z.string().min(8, "Your password must be at least 8 characters long. Please choose a stronger password to keep your account secure."),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createOrderSchema = z.object({
  token: z.string().min(1),
  itemType: z.enum(["course", "event"]),
  itemSlug: z.string().min(1),
});

export const confirmPaymentSchema = z.object({
  token: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
