import Razorpay from "razorpay";
import crypto from "node:crypto";
import { getEnv } from "./env";

let razorpay: Razorpay | null = null;

function getRazorpayClient() {
  if (!razorpay) {
    const env = getEnv();
    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export async function createRazorpayOrder(amount: number, orderRef: string) {
  return getRazorpayClient().orders.create({
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
  const secret = getEnv().RAZORPAY_KEY_SECRET;
  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex");
  return generated === input.razorpay_signature;
}
