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

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function inferEndFromDuration(start: string, duration: string | null | undefined): string {
  if (!duration) return start;
  const weeks = duration.match(/(\d+)\s*week/i);
  if (weeks) return addDaysIso(start, Number(weeks[1]) * 7);
  const days = duration.match(/(\d+)\s*day/i);
  if (days) return addDaysIso(start, Math.max(0, Number(days[1]) - 1));
  return start;
}

function earlierYmd(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
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

type ProgramTimeline = {
  slug: string;
  title: string;
  active: number;
  startDate: string;
  endDate: string;
  registrationCloseDate: string;
};

async function loadProgramTimeline(
  itemType: "course" | "event",
  itemSlug: string,
): Promise<ProgramTimeline | null> {
  const slug = itemSlug.trim();
  if (!slug) return null;

  if (itemType === "course") {
    const rows = await dbQuery<
      Array<{
        slug: string;
        title: string;
        active: number;
        start_date: string | Date | null;
        program_end_date: string | Date | null;
        registration_close_date: string | Date | null;
        duration: string | null;
      }>
    >(
      `SELECT slug, title, active, start_date, program_end_date, registration_close_date, duration
       FROM courses WHERE LOWER(TRIM(slug)) = LOWER(?) LIMIT 1`,
      [slug],
    );
    const r = rows[0];
    if (!r) return null;
    const start = parseDbDateToYmd(r.start_date) ?? "";
    const storedEnd = parseDbDateToYmd(r.program_end_date);
    const end =
      storedEnd && storedEnd !== start ? storedEnd : inferEndFromDuration(start, r.duration);
    const close = parseDbDateToYmd(r.registration_close_date) ?? start;
    return {
      slug: r.slug,
      title: r.title,
      active: r.active,
      startDate: start,
      endDate: end < start ? start : end,
      registrationCloseDate: close,
    };
  }

  const rows = await dbQuery<
    Array<{
      slug: string;
      title: string;
      active: number;
      event_date: string | Date | null;
      program_end_date: string | Date | null;
      registration_close_date: string | Date | null;
    }>
  >(
    `SELECT slug, title, active, event_date, program_end_date, registration_close_date
     FROM events WHERE LOWER(TRIM(slug)) = LOWER(?) LIMIT 1`,
    [slug],
  );
  const r = rows[0];
  if (!r) return null;
  const start = parseDbDateToYmd(r.event_date) ?? "";
  const end = parseDbDateToYmd(r.program_end_date) ?? start;
  const close = parseDbDateToYmd(r.registration_close_date) ?? start;
  return {
    slug: r.slug,
    title: r.title,
    active: r.active,
    startDate: start,
    endDate: end < start ? start : end,
    registrationCloseDate: close,
  };
}

/** Resolve slug casing to the canonical DB value; throws if missing or not published. */
async function resolveCanonicalScope(
  itemType: "course" | "event",
  itemSlug: string,
): Promise<{ item_type: "course" | "event"; item_slug: string }> {
  const program = await loadProgramTimeline(itemType, itemSlug);
  if (!program) {
    throw new Error(
      itemType === "course"
        ? `Course not found: ${itemSlug}`
        : `Event not found: ${itemSlug}`,
    );
  }
  if (Number(program.active) !== 1) {
    throw new Error(
      itemType === "course"
        ? `Course is not active: ${itemSlug}`
        : `Event is not active: ${itemSlug}`,
    );
  }
  return { item_type: itemType, item_slug: program.slug };
}

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

  const coupons = await dbQuery<
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
    `SELECT id, discount_type, discount_value, active, max_uses, uses_count, valid_from, valid_until
     FROM coupons WHERE code = ? LIMIT 1`,
    [code],
  );
  const c = coupons[0];
  if (!c) {
    return { ok: false, message: "Coupon code not found" };
  }
  if (!c.active) {
    return { ok: false, message: "This coupon is no longer active" };
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

  const scopes = await dbQuery<Array<{ item_type: string; item_slug: string }>>(
    `SELECT item_type, item_slug FROM coupon_scopes WHERE coupon_id = ?`,
    [c.id],
  );
  if (!scopes.length) {
    return {
      ok: false,
      message: "This coupon is not linked to any course or event. Ask the admin to edit it.",
    };
  }

  const slugNorm = itemSlug.trim().toLowerCase();
  const typeNorm = itemType.trim().toLowerCase();
  const scopeHit = scopes.find(
    (s) =>
      String(s.item_type).trim().toLowerCase() === typeNorm &&
      String(s.item_slug).trim().toLowerCase() === slugNorm,
  );
  if (!scopeHit) {
    const labels = scopes
      .map((s) => `${s.item_type}:${s.item_slug}`)
      .slice(0, 3)
      .join(", ");
    return {
      ok: false,
      message: `This coupon is not valid for this ${itemType}. It applies to: ${labels}${scopes.length > 3 ? "…" : ""}`,
    };
  }

  const program = await loadProgramTimeline(itemType, itemSlug);
  if (!program) {
    return { ok: false, message: "This course or event was not found" };
  }
  if (!program.active) {
    return {
      ok: false,
      message: "This coupon cannot be used — the program is not published",
    };
  }

  const today = todayYmdKolkata();
  if (program.endDate && today > program.endDate) {
    return {
      ok: false,
      message: "This coupon cannot be used — the program has ended",
    };
  }

  // Coupon window ends at the earliest of: coupon.valid_until, early registration close, program end.
  // Match program lifecycle: registration is only "closed" when close < start (early cutoff).
  // If close === start (common DB default), registration stays open through program end — so must coupons.
  const couponUntil = parseDbDateToYmd(c.valid_until);
  const regClose = program.registrationCloseDate || null;
  const earlyRegClose =
    regClose && program.startDate && regClose < program.startDate ? regClose : null;
  const programCutoff = earlierYmd(earlyRegClose, program.endDate) ?? program.endDate;
  const effectiveUntil = earlierYmd(couponUntil, programCutoff);
  if (effectiveUntil && today > effectiveUntil) {
    if (couponUntil && (!programCutoff || couponUntil <= programCutoff)) {
      return { ok: false, message: "Coupon has expired" };
    }
    if (earlyRegClose && today > earlyRegClose && today <= program.endDate) {
      return {
        ok: false,
        message: "This coupon cannot be used — registration for the program has closed",
      };
    }
    return {
      ok: false,
      message: "This coupon cannot be used — the program timeline has ended",
    };
  }

  const fromYmd = parseDbDateToYmd(c.valid_from);
  if (fromYmd && today < fromYmd) {
    return { ok: false, message: "Coupon is not active yet" };
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

/** Atomically consume one use. Returns false if the coupon hit its max_uses limit. */
export async function tryIncrementCouponUse(couponId: number): Promise<boolean> {
  const result = await dbQuery<ResultSetHeader>(
    `UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ? AND (max_uses IS NULL OR uses_count < max_uses)`,
    [couponId],
  );
  return (result.affectedRows ?? 0) > 0;
}

export async function incrementCouponUse(couponId: number): Promise<void> {
  const ok = await tryIncrementCouponUse(couponId);
  if (!ok) {
    throw new Error("This coupon has reached its usage limit");
  }
}

export type CouponScopeRow = {
  item_type: "course" | "event";
  item_slug: string;
  title: string;
};

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
  scopes: CouponScopeRow[];
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
    Array<{
      coupon_id: number;
      item_type: "course" | "event";
      item_slug: string;
      title: string | null;
    }>
  >(
    `SELECT s.coupon_id, s.item_type, s.item_slug,
            COALESCE(c.title, e.title) AS title
     FROM coupon_scopes s
     LEFT JOIN courses c ON s.item_type = 'course' AND LOWER(TRIM(c.slug)) = LOWER(TRIM(s.item_slug))
     LEFT JOIN events e ON s.item_type = 'event' AND LOWER(TRIM(e.slug)) = LOWER(TRIM(s.item_slug))
     ORDER BY s.coupon_id, s.id`,
  );
  const byCoupon = new Map<number, CouponScopeRow[]>();
  for (const s of scopes) {
    const list = byCoupon.get(s.coupon_id) ?? [];
    list.push({
      item_type: s.item_type,
      item_slug: s.item_slug,
      title: s.title?.trim() || s.item_slug,
    });
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
    valid_from: parseDbDateToYmd(c.valid_from),
    valid_until: parseDbDateToYmd(c.valid_until),
    scopes: byCoupon.get(c.id) ?? [],
  }));
}

function isDuplicateCouponCodeError(e: unknown): boolean {
  const err = e as { code?: string; errno?: number; message?: string };
  return (
    err?.code === "ER_DUP_ENTRY" ||
    err?.errno === 1062 ||
    /duplicate/i.test(String(err?.message ?? ""))
  );
}

async function normalizeScopes(
  scopes: Array<{ item_type: "course" | "event"; item_slug: string }>,
): Promise<Array<{ item_type: "course" | "event"; item_slug: string }>> {
  const out: Array<{ item_type: "course" | "event"; item_slug: string }> = [];
  const seen = new Set<string>();
  for (const s of scopes) {
    const canonical = await resolveCanonicalScope(s.item_type, s.item_slug);
    const key = `${canonical.item_type}::${canonical.item_slug.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  if (!out.length) throw new Error("Add at least one course or event");
  return out;
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

  const scopes = await normalizeScopes(input.scopes);

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
    for (const s of scopes) {
      await conn.query(
        `INSERT INTO coupon_scopes (coupon_id, item_type, item_slug) VALUES (?, ?, ?)`,
        [couponId, s.item_type, s.item_slug],
      );
    }
    await conn.query("COMMIT");
  } catch (e) {
    await conn.query("ROLLBACK").catch(() => {});
    if (isDuplicateCouponCodeError(e)) {
      throw new Error("A coupon with this code already exists");
    }
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

  const scopes = await normalizeScopes(input.scopes);

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
    for (const s of scopes) {
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
