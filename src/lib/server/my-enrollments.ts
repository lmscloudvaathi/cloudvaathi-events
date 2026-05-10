import { dbQuery } from "./db";
import { normalizeEnrollmentPaymentStatus } from "../enrollment-utils";

export type MyEnrollmentRow = {
  item_type: "course" | "event";
  item_slug: string;
  payment_status: "Paid" | "Pending" | "Refunded";
  amount: number;
  registered_at: string;
  title: string | null;
};

export type ItemEnrollmentStatus = {
  payment_status: "Paid" | "Pending" | "Refunded";
  amount: number;
  registered_at: string;
};

/** Single-item lookup for detail pages (course/event). */
export async function getEnrollmentForItem(
  userId: number,
  itemType: "course" | "event",
  itemSlug: string,
): Promise<ItemEnrollmentStatus | null> {
  const rows = await dbQuery<
    Array<{ payment_status: unknown; amount: number; registered_at: string | Date }>
  >(
    `SELECT payment_status, amount, registered_at FROM enrollments
     WHERE user_id = ? AND item_type = ? AND item_slug = ? LIMIT 1`,
    [userId, itemType, itemSlug],
  );
  const r = rows[0];
  if (!r) return null;
  const registeredAt =
    typeof r.registered_at === "string" ? r.registered_at : String(r.registered_at);
  return {
    payment_status: normalizeEnrollmentPaymentStatus(r.payment_status),
    amount: Number(r.amount),
    registered_at: registeredAt,
  };
}

export async function listMyEnrollments(userId: number): Promise<MyEnrollmentRow[]> {
  const rows = await dbQuery<
    Array<{
      item_type: "course" | "event";
      item_slug: string;
      payment_status: unknown;
      amount: number;
      registered_at: string | Date;
      title: string | null;
    }>
  >(
    `SELECT e.item_type, e.item_slug, e.payment_status, e.amount, e.registered_at,
            COALESCE(c.title, ev.title) AS title
     FROM enrollments e
     LEFT JOIN courses c ON e.item_type = 'course' AND c.slug = e.item_slug
     LEFT JOIN events ev ON e.item_type = 'event' AND ev.slug = e.item_slug
     WHERE e.user_id = ?
     ORDER BY e.registered_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    item_type: r.item_type,
    item_slug: r.item_slug,
    payment_status: normalizeEnrollmentPaymentStatus(r.payment_status),
    amount: Number(r.amount),
    registered_at:
      typeof r.registered_at === "string" ? r.registered_at : String(r.registered_at),
    title: r.title,
  }));
}
