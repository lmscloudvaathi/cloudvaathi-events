import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8),
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
