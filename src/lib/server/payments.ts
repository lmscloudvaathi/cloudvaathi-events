import { dbQuery } from "./db";
import { getPurchasableItem } from "./catalog";
import { createRazorpayOrder, verifyRazorpaySignature } from "./razorpay";
import {
  sendEnrollmentConfirmationEmail,
  sendRegistrationPendingEmail,
} from "./mailer";

export async function createOrder(input: {
  userId: number;
  itemType: "course" | "event";
  itemSlug: string;
}) {
  const item = await getPurchasableItem(input.itemType, input.itemSlug);
  if (!item) {
    throw new Error("Item not found");
  }
  if (item.amount <= 0) {
    throw new Error("This item is free — complete enrollment without payment.");
  }
  const orderRef = `CV_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO orders (order_ref, user_id, item_type, item_slug, amount, currency, status)
     VALUES (?, ?, ?, ?, ?, 'INR', 'created')`,
    [orderRef, input.userId, input.itemType, input.itemSlug, item.amount],
  );
  const rpOrder = await createRazorpayOrder(item.amount, orderRef);
  await dbQuery(
    `INSERT INTO payments (order_ref, razorpay_order_id, amount, currency, status)
     VALUES (?, ?, ?, 'INR', 'created')
     ON DUPLICATE KEY UPDATE razorpay_order_id=VALUES(razorpay_order_id)`,
    [orderRef, rpOrder.id, item.amount],
  );

  return { orderRef, razorpayOrderId: rpOrder.id, amount: item.amount, itemTitle: item.title };
}

export async function startRegistration(input: {
  userId: number;
  itemType: "course" | "event";
  itemSlug: string;
  userEmail: string;
  userName: string;
}) {
  const item = await getPurchasableItem(input.itemType, input.itemSlug);
  if (!item) throw new Error("Item not found");
  if (item.amount <= 0) {
    throw new Error("This item is free — use enroll without payment.");
  }

  const existing = await dbQuery<Array<{ payment_status: "Paid" | "Pending" | "Refunded" }>>(
    `SELECT payment_status FROM enrollments WHERE user_id=? AND item_type=? AND item_slug=? LIMIT 1`,
    [input.userId, input.itemType, input.itemSlug],
  );
  if (existing[0]?.payment_status === "Paid") {
    return { alreadyEnrolled: true };
  }

  const pendingRef = `REG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status)
     VALUES (?, ?, ?, ?, ?, 'Pending')
     ON DUPLICATE KEY UPDATE amount=VALUES(amount), payment_status='Pending'`,
    [input.userId, input.itemType, input.itemSlug, pendingRef, item.amount],
  );

  try {
    await sendRegistrationPendingEmail({
      to: input.userEmail,
      name: input.userName,
      itemTitle: item.title,
      itemKind: input.itemType === "course" ? "course" : "event",
      amount: item.amount,
    });
  } catch (error) {
    console.error("Registration pending mail failed", error);
  }

  return { alreadyEnrolled: false };
}

export async function completeFreeEnrollment(input: {
  userId: number;
  userEmail: string;
  userName: string;
  itemType: "course" | "event";
  itemSlug: string;
}) {
  const item = await getPurchasableItem(input.itemType, input.itemSlug);
  if (!item) throw new Error("Item not found");
  if (item.amount > 0) {
    throw new Error("This item requires payment.");
  }

  const existing = await dbQuery<Array<{ payment_status: "Paid" | "Pending" | "Refunded" }>>(
    `SELECT payment_status FROM enrollments WHERE user_id=? AND item_type=? AND item_slug=? LIMIT 1`,
    [input.userId, input.itemType, input.itemSlug],
  );
  if (existing[0]?.payment_status === "Paid") {
    return { alreadyEnrolled: true };
  }

  const orderRef = `FREE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status)
     VALUES (?, ?, ?, ?, 0, 'Paid')
     ON DUPLICATE KEY UPDATE payment_status='Paid', amount=0, order_ref=VALUES(order_ref)`,
    [input.userId, input.itemType, input.itemSlug, orderRef],
  );

  if (input.itemType === "course") {
    await dbQuery(`UPDATE courses SET enrolled = enrolled + 1 WHERE slug = ?`, [input.itemSlug]);
  } else {
    await dbQuery(`UPDATE events SET registered = registered + 1 WHERE slug = ?`, [input.itemSlug]);
  }

  try {
    await sendEnrollmentConfirmationEmail({
      to: input.userEmail,
      name: input.userName,
      itemTitle: item.title,
      itemKind: input.itemType === "course" ? "course" : "event",
      amount: 0,
      orderRef,
    });
  } catch (error) {
    console.error("Free enrollment mail failed", error);
  }

  return { success: true as const, orderRef };
}

export async function confirmPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: number;
  userEmail: string;
  userName: string;
}) {
  if (!verifyRazorpaySignature(input)) {
    throw new Error("Invalid payment signature");
  }
  const paymentRows = await dbQuery<{ order_ref: string; status: string }[]>(
    `SELECT order_ref, status FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
    [input.razorpay_order_id],
  );
  const payment = paymentRows[0];
  if (!payment) throw new Error("Payment order missing");
  if (payment.status === "paid") return { alreadyPaid: true };

  const orderRows = await dbQuery<
    { order_ref: string; item_type: "course" | "event"; item_slug: string; amount: number }[]
  >(`SELECT order_ref, item_type, item_slug, amount FROM orders WHERE order_ref = ? LIMIT 1`, [
    payment.order_ref,
  ]);
  const order = orderRows[0];
  if (!order) throw new Error("Order missing");

  await dbQuery(
    `UPDATE payments SET razorpay_payment_id=?, razorpay_signature=?, status='paid' WHERE order_ref=?`,
    [input.razorpay_payment_id, input.razorpay_signature, order.order_ref],
  );
  await dbQuery(`UPDATE orders SET status='paid' WHERE order_ref=?`, [order.order_ref]);
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status)
     VALUES (?, ?, ?, ?, ?, 'Paid')
     ON DUPLICATE KEY UPDATE payment_status='Paid', amount=VALUES(amount), order_ref=VALUES(order_ref)`,
    [input.userId, order.item_type, order.item_slug, order.order_ref, order.amount],
  );

  if (order.item_type === "course") {
    await dbQuery(`UPDATE courses SET enrolled = enrolled + 1 WHERE slug = ?`, [order.item_slug]);
  } else {
    await dbQuery(`UPDATE events SET registered = registered + 1 WHERE slug = ?`, [order.item_slug]);
  }

  const item = await getPurchasableItem(order.item_type, order.item_slug);
  if (item) {
    try {
      await sendEnrollmentConfirmationEmail({
        to: input.userEmail,
        name: input.userName,
        itemTitle: item.title,
        itemKind: order.item_type === "course" ? "course" : "event",
        amount: order.amount,
        orderRef: order.order_ref,
        paymentId: input.razorpay_payment_id,
      });
      await dbQuery(`UPDATE payments SET email_sent = 1 WHERE order_ref = ?`, [order.order_ref]);
    } catch (error) {
      console.error("Enrollment confirmation mail failed", error);
    }
  }

  return { success: true, orderRef: order.order_ref };
}
