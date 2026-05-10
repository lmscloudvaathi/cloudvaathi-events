import Razorpay from "razorpay";
import crypto from "node:crypto";
import { getEnv } from "./env";

const env = getEnv();
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function createRazorpayOrder(amount: number, orderRef: string) {
  return razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: orderRef,
    notes: { orderRef },
  });
}

export function verifyRazorpaySignature(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const generated = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex");
  return generated === input.razorpay_signature;
}
