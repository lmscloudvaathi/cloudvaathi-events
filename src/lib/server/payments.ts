import { dbQuery } from "./db";
import { getPurchasableItem } from "./catalog";
import { createRazorpayOrder, verifyRazorpaySignature } from "./razorpay";
import { incrementCouponUse, resolveCouponForCheckout } from "./coupons";
import {
  sendEnrollmentConfirmationEmail,
  sendRegistrationPendingEmail,
} from "./mailer";

type ItemKind = "course" | "event";

async function resolvePricing(
  itemType: ItemKind,
  itemSlug: string,
  listPrice: number,
  couponCode?: string | null,
) {
  let couponId: number | null = null;
  let originalAmount = listPrice;
  let discountAmount = 0;
  let finalAmount = listPrice;
  if (couponCode?.trim()) {
    const r = await resolveCouponForCheckout(couponCode, itemType, itemSlug, listPrice);
    if (!r.ok) throw new Error(r.message);
    couponId = r.couponId;
    originalAmount = r.listAmount;
    discountAmount = r.discountAmount;
    finalAmount = r.finalAmount;
  }
  return { couponId, originalAmount, discountAmount, finalAmount };
}

async function syncPendingEnrollmentAmounts(input: {
  userId: number;
  itemType: ItemKind;
  itemSlug: string;
  couponId: number | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}) {
  await dbQuery(
    `UPDATE enrollments
     SET amount=?, original_amount=?, discount_amount=?, coupon_id=?
     WHERE user_id=? AND item_type=? AND item_slug=? AND payment_status='Pending'`,
    [
      input.finalAmount,
      input.originalAmount,
      input.discountAmount,
      input.couponId,
      input.userId,
      input.itemType,
      input.itemSlug,
    ],
  );
}

async function finalizeFullCouponEnrollment(input: {
  userId: number;
  userEmail: string;
  userName: string;
  itemType: ItemKind;
  itemSlug: string;
  itemTitle: string;
  couponId: number;
  originalAmount: number;
  discountAmount: number;
}) {
  const orderRef = `COUPON_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status, coupon_id, original_amount, discount_amount)
     VALUES (?, ?, ?, ?, 0, 'Paid', ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       payment_status='Paid',
       amount=0,
       order_ref=VALUES(order_ref),
       coupon_id=VALUES(coupon_id),
       original_amount=VALUES(original_amount),
       discount_amount=VALUES(discount_amount)`,
    [
      input.userId,
      input.itemType,
      input.itemSlug,
      orderRef,
      input.couponId,
      input.originalAmount,
      input.discountAmount,
    ],
  );

  if (input.itemType === "course") {
    await dbQuery(`UPDATE courses SET enrolled = enrolled + 1 WHERE slug = ?`, [input.itemSlug]);
  } else {
    await dbQuery(`UPDATE events SET registered = registered + 1 WHERE slug = ?`, [input.itemSlug]);
  }

  await incrementCouponUse(input.couponId);

  try {
    await sendEnrollmentConfirmationEmail({
      to: input.userEmail,
      name: input.userName,
      itemTitle: input.itemTitle,
      itemKind: input.itemType === "course" ? "course" : "event",
      amount: 0,
      orderRef,
    });
  } catch (error) {
    console.error("Enrollment confirmation mail failed", error);
  }

  return {
    orderRef,
    razorpayOrderId: null as string | null,
    amount: 0,
    itemTitle: input.itemTitle,
    paidViaFullCoupon: true as const,
  };
}

export async function createOrder(input: {
  userId: number;
  userEmail: string;
  userName: string;
  itemType: ItemKind;
  itemSlug: string;
  couponCode?: string | null;
}) {
  const item = await getPurchasableItem(input.itemType, input.itemSlug);
  if (!item) {
    throw new Error("Item not found");
  }
  if (item.amount <= 0) {
    throw new Error("This item is free — complete enrollment without payment.");
  }

  const paid = await dbQuery<Array<{ payment_status: string }>>(
    `SELECT payment_status FROM enrollments WHERE user_id=? AND item_type=? AND item_slug=? LIMIT 1`,
    [input.userId, input.itemType, input.itemSlug],
  );
  if (paid[0]?.payment_status === "Paid") {
    throw new Error("You are already enrolled for this item.");
  }

  let couponCodeForResolve = input.couponCode?.trim() || null;
  if (!couponCodeForResolve) {
    const pendRows = await dbQuery<Array<{ coupon_id: number | null }>>(
      `SELECT coupon_id FROM enrollments WHERE user_id=? AND item_type=? AND item_slug=? AND payment_status='Pending' LIMIT 1`,
      [input.userId, input.itemType, input.itemSlug],
    );
    const cid = pendRows[0]?.coupon_id;
    if (cid != null) {
      const codeRows = await dbQuery<Array<{ code: string }>>(`SELECT code FROM coupons WHERE id=? LIMIT 1`, [cid]);
      couponCodeForResolve = codeRows[0]?.code ?? null;
    }
  }

  const { couponId, originalAmount, discountAmount, finalAmount } = await resolvePricing(
    input.itemType,
    input.itemSlug,
    item.amount,
    couponCodeForResolve,
  );

  await syncPendingEnrollmentAmounts({
    userId: input.userId,
    itemType: input.itemType,
    itemSlug: input.itemSlug,
    couponId,
    originalAmount,
    discountAmount,
    finalAmount,
  });

  if (finalAmount <= 0) {
    if (!couponId) throw new Error("Invalid amount");
    return finalizeFullCouponEnrollment({
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      itemType: input.itemType,
      itemSlug: input.itemSlug,
      itemTitle: item.title,
      couponId,
      originalAmount,
      discountAmount,
    });
  }

  const orderRef = `CV_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO orders (order_ref, user_id, item_type, item_slug, amount, currency, status, coupon_id, original_amount, discount_amount)
     VALUES (?, ?, ?, ?, ?, 'INR', 'created', ?, ?, ?)`,
    [orderRef, input.userId, input.itemType, input.itemSlug, finalAmount, couponId, originalAmount, discountAmount],
  );
  const rpOrder = await createRazorpayOrder(finalAmount, orderRef);
  await dbQuery(
    `INSERT INTO payments (order_ref, razorpay_order_id, amount, currency, status)
     VALUES (?, ?, ?, 'INR', 'created')
     ON DUPLICATE KEY UPDATE razorpay_order_id=VALUES(razorpay_order_id)`,
    [orderRef, rpOrder.id, finalAmount],
  );

  return {
    orderRef,
    razorpayOrderId: rpOrder.id,
    amount: finalAmount,
    itemTitle: item.title,
    paidViaFullCoupon: false as const,
  };
}

export async function startRegistration(input: {
  userId: number;
  itemType: ItemKind;
  itemSlug: string;
  userEmail: string;
  userName: string;
  couponCode?: string | null;
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
    return { alreadyEnrolled: true as const };
  }

  const { couponId, originalAmount, discountAmount, finalAmount } = await resolvePricing(
    input.itemType,
    input.itemSlug,
    item.amount,
    input.couponCode,
  );

  if (finalAmount <= 0) {
    if (!couponId) throw new Error("Invalid amount");
    await finalizeFullCouponEnrollment({
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      itemType: input.itemType,
      itemSlug: input.itemSlug,
      itemTitle: item.title,
      couponId,
      originalAmount,
      discountAmount,
    });
    return { alreadyEnrolled: false as const, autoCompletedWithCoupon: true as const };
  }

  const pendingRef = `REG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status, coupon_id, original_amount, discount_amount)
     VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       amount=VALUES(amount),
       coupon_id=VALUES(coupon_id),
       original_amount=VALUES(original_amount),
       discount_amount=VALUES(discount_amount),
       payment_status='Pending'`,
    [
      input.userId,
      input.itemType,
      input.itemSlug,
      pendingRef,
      finalAmount,
      couponId,
      originalAmount,
      discountAmount,
    ],
  );

  try {
    await sendRegistrationPendingEmail({
      to: input.userEmail,
      name: input.userName,
      itemTitle: item.title,
      itemKind: input.itemType === "course" ? "course" : "event",
      amount: finalAmount,
    });
  } catch (error) {
    console.error("Registration pending mail failed", error);
  }

  return { alreadyEnrolled: false as const, autoCompletedWithCoupon: false as const };
}

export async function completeFreeEnrollment(input: {
  userId: number;
  userEmail: string;
  userName: string;
  itemType: ItemKind;
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
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status, coupon_id, original_amount, discount_amount)
     VALUES (?, ?, ?, ?, 0, 'Paid', NULL, NULL, 0)
     ON DUPLICATE KEY UPDATE payment_status='Paid', amount=0, coupon_id=NULL, original_amount=NULL, discount_amount=0, order_ref=VALUES(order_ref)`,
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
    Array<{
      order_ref: string;
      item_type: ItemKind;
      item_slug: string;
      amount: number;
      coupon_id: number | null;
      original_amount: number | null;
      discount_amount: number | null;
    }>
  >(
    `SELECT order_ref, item_type, item_slug, amount, coupon_id, original_amount, discount_amount
     FROM orders WHERE order_ref = ? LIMIT 1`,
    [payment.order_ref],
  );
  const order = orderRows[0];
  if (!order) throw new Error("Order missing");

  await dbQuery(
    `UPDATE payments SET razorpay_payment_id=?, razorpay_signature=?, status='paid' WHERE order_ref=?`,
    [input.razorpay_payment_id, input.razorpay_signature, order.order_ref],
  );
  await dbQuery(`UPDATE orders SET status='paid' WHERE order_ref=?`, [order.order_ref]);

  const disc = order.discount_amount ?? 0;
  await dbQuery(
    `INSERT INTO enrollments (user_id, item_type, item_slug, order_ref, amount, payment_status, coupon_id, original_amount, discount_amount)
     VALUES (?, ?, ?, ?, ?, 'Paid', ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       payment_status='Paid',
       amount=VALUES(amount),
       order_ref=VALUES(order_ref),
       coupon_id=VALUES(coupon_id),
       original_amount=VALUES(original_amount),
       discount_amount=VALUES(discount_amount)`,
    [
      input.userId,
      order.item_type,
      order.item_slug,
      order.order_ref,
      order.amount,
      order.coupon_id,
      order.original_amount,
      disc,
    ],
  );

  if (order.coupon_id != null) {
    await incrementCouponUse(order.coupon_id);
  }

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
