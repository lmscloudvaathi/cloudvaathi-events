import type { ResultSetHeader } from "mysql2";
import { dbQuery, getOrCreateMysqlConnection } from "./db";

export function normalizeCouponCode(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Parse MySQL DATE (string or JS Date) to `YYYY-MM-DD` for comparisons. */
function parseDbDateToYmd(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t.startsWith("0000-00")) return null;
    const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    return ymdFromUtcDate(d);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return ymdFromUtcDate(value);
  }
  return null;
}

function ymdFromUtcDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Calendar today in Asia/Kolkata — matches how admins pick dates in the UI and DB DATE semantics. */
function todayYmdKolkata(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const mo = parts.find((p) => p.type === "month")?.value;
  const da = parts.find((p) => p.type === "day")?.value;
  if (y && mo && da) return `${y}-${mo}-${da}`;
  return ymdFromUtcDate(new Date());
}

export function computeDiscountedPrice(
  listPrice: number,
  discountType: "percent" | "fixed",
  discountValue: number,
): { discountAmount: number; finalAmount: number } {
  if (listPrice <= 0) return { discountAmount: 0, finalAmount: 0 };
  let discount = 0;
  if (discountType === "percent") {
    const p = Math.min(100, Math.max(0, discountValue));
    discount = Math.floor((listPrice * p) / 100);
  } else {
    discount = Math.min(listPrice, Math.max(0, discountValue));
  }
  const finalAmount = Math.max(0, listPrice - discount);
  return { discountAmount: discount, finalAmount };
}

export type ResolveCouponOk = {
  ok: true;
  couponId: number;
  code: string;
  listAmount: number;
  discountAmount: number;
  finalAmount: number;
};

export type ResolveCouponErr = { ok: false; message: string };

export type ResolveCouponResult = ResolveCouponOk | ResolveCouponErr;

export async function resolveCouponForCheckout(
  codeRaw: string | undefined | null,
  itemType: "course" | "event",
  itemSlug: string,
  listPrice: number,
): Promise<ResolveCouponResult> {
  const code = normalizeCouponCode(codeRaw);
  if (!code) {
    return { ok: false, message: "Enter a coupon code" };
  }
  const rows = await dbQuery<
    Array<{
      id: number;
      discount_type: "percent" | "fixed";
      discount_value: number;
      active: number;
      max_uses: number | null;
      uses_count: number;
      valid_from: string | Date | null;
      valid_until: string | Date | null;
    }>
  >(
    `SELECT c.id, c.discount_type, c.discount_value, c.active, c.max_uses, c.uses_count, c.valid_from, c.valid_until
     FROM coupons c
     INNER JOIN coupon_scopes s ON s.coupon_id = c.id AND s.item_type = ? AND s.item_slug = ?
     WHERE c.code = ? LIMIT 1`,
    [itemType, itemSlug, code],
  );
  const c = rows[0];
  if (!c || !c.active) {
    return { ok: false, message: "Invalid coupon for this item" };
  }
  if (c.discount_type === "percent" && (c.discount_value < 1 || c.discount_value > 100)) {
    return { ok: false, message: "Coupon is misconfigured (percent)" };
  }
  if (c.discount_type === "fixed" && c.discount_value < 0) {
    return { ok: false, message: "Coupon is misconfigured (fixed)" };
  }
  if (c.max_uses != null && c.uses_count >= c.max_uses) {
    return { ok: false, message: "This coupon has reached its usage limit" };
  }
  const today = todayYmdKolkata();
  const fromYmd = parseDbDateToYmd(c.valid_from);
  if (fromYmd && today < fromYmd) {
    return { ok: false, message: "Coupon is not active yet" };
  }
  const untilYmd = parseDbDateToYmd(c.valid_until);
  if (untilYmd && today > untilYmd) {
    return { ok: false, message: "Coupon has expired" };
  }
  const { discountAmount, finalAmount } = computeDiscountedPrice(
    listPrice,
    c.discount_type,
    c.discount_value,
  );
  return {
    ok: true,
    couponId: c.id,
    code,
    listAmount: listPrice,
    discountAmount,
    finalAmount,
  };
}

export async function incrementCouponUse(couponId: number): Promise<void> {
  await dbQuery(
    `UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ? AND (max_uses IS NULL OR uses_count < max_uses)`,
    [couponId],
  );
}

export type CouponListRow = {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  scopes: Array<{ item_type: "course" | "event"; item_slug: string }>;
};

export async function adminListCoupons(): Promise<CouponListRow[]> {
  const coupons = await dbQuery<
    Array<{
      id: number;
      code: string;
      description: string | null;
      discount_type: "percent" | "fixed";
      discount_value: number;
      active: number;
      max_uses: number | null;
      uses_count: number;
      valid_from: string | Date | null;
      valid_until: string | Date | null;
    }>
  >(
    `SELECT id, code, description, discount_type, discount_value, active, max_uses, uses_count, valid_from, valid_until
     FROM coupons ORDER BY id DESC`,
  );
  const scopes = await dbQuery<
    Array<{ coupon_id: number; item_type: "course" | "event"; item_slug: string }>
  >(`SELECT coupon_id, item_type, item_slug FROM coupon_scopes ORDER BY coupon_id, id`);
  const byCoupon = new Map<number, Array<{ item_type: "course" | "event"; item_slug: string }>>();
  for (const s of scopes) {
    const list = byCoupon.get(s.coupon_id) ?? [];
    list.push({ item_type: s.item_type, item_slug: s.item_slug });
    byCoupon.set(s.coupon_id, list);
  }
  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discount_type: c.discount_type,
    discount_value: c.discount_value,
    active: c.active,
    max_uses: c.max_uses,
    uses_count: c.uses_count,
    valid_from: c.valid_from ? String(c.valid_from).slice(0, 10) : null,
    valid_until: c.valid_until ? String(c.valid_until).slice(0, 10) : null,
    scopes: byCoupon.get(c.id) ?? [],
  }));
}

export async function adminCreateCoupon(input: {
  code: string;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  scopes: Array<{ item_type: "course" | "event"; item_slug: string }>;
}) {
  const code = normalizeCouponCode(input.code);
  if (!code) throw new Error("Coupon code is required");
  if (!input.scopes.length) throw new Error("Add at least one course or event");
  if (input.discount_type === "percent" && (input.discount_value < 1 || input.discount_value > 100)) {
    throw new Error("Percent discount must be between 1 and 100");
  }
  if (input.discount_type === "fixed" && input.discount_value < 0) {
    throw new Error("Fixed discount cannot be negative");
  }

  const conn = await getOrCreateMysqlConnection();
  await conn.query("START TRANSACTION");
  try {
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO coupons (code, description, discount_type, discount_value, active, max_uses, valid_from, valid_until)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        code,
        input.description?.trim() || null,
        input.discount_type,
        input.discount_value,
        input.max_uses ?? null,
        input.valid_from?.trim() || null,
        input.valid_until?.trim() || null,
      ],
    );
    const couponId = ins.insertId;
    for (const s of input.scopes) {
      await conn.query(
        `INSERT INTO coupon_scopes (coupon_id, item_type, item_slug) VALUES (?, ?, ?)`,
        [couponId, s.item_type, s.item_slug],
      );
    }
    await conn.query("COMMIT");
  } catch (e) {
    await conn.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

export async function adminUpdateCoupon(input: {
  id: number;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  scopes: Array<{ item_type: "course" | "event"; item_slug: string }>;
}) {
  if (!input.scopes.length) throw new Error("Add at least one course or event");
  if (input.discount_type === "percent" && (input.discount_value < 1 || input.discount_value > 100)) {
    throw new Error("Percent discount must be between 1 and 100");
  }
  if (input.discount_type === "fixed" && input.discount_value < 0) {
    throw new Error("Fixed discount cannot be negative");
  }

  const conn = await getOrCreateMysqlConnection();
  await conn.query("START TRANSACTION");
  try {
    await conn.query(
      `UPDATE coupons SET description=?, discount_type=?, discount_value=?, max_uses=?, valid_from=?, valid_until=?
       WHERE id=?`,
      [
        input.description?.trim() || null,
        input.discount_type,
        input.discount_value,
        input.max_uses ?? null,
        input.valid_from?.trim() || null,
        input.valid_until?.trim() || null,
        input.id,
      ],
    );
    await conn.query(`DELETE FROM coupon_scopes WHERE coupon_id=?`, [input.id]);
    for (const s of input.scopes) {
      await conn.query(
        `INSERT INTO coupon_scopes (coupon_id, item_type, item_slug) VALUES (?, ?, ?)`,
        [input.id, s.item_type, s.item_slug],
      );
    }
    await conn.query("COMMIT");
  } catch (e) {
    await conn.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

export async function adminSetCouponActive(id: number, active: boolean): Promise<void> {
  await dbQuery(`UPDATE coupons SET active=? WHERE id=?`, [active ? 1 : 0, id]);
}
