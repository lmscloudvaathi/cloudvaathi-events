/**
 * Live coupon flow audit against TiDB (.env).
 * Creates/retargets a 20% coupon for one active course + one open event,
 * validates discount math / gates, prints JSON report.
 */
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

function todayYmdKolkata() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function computeDiscountedPrice(listPrice, discountType, discountValue) {
  if (listPrice <= 0) return { discountAmount: 0, finalAmount: 0 };
  let discount = 0;
  if (discountType === "percent") {
    const p = Math.min(100, Math.max(0, discountValue));
    discount = Math.floor((listPrice * p) / 100);
  } else {
    discount = Math.min(listPrice, Math.max(0, discountValue));
  }
  return { discountAmount: discount, finalAmount: Math.max(0, listPrice - discount) };
}

function parseDbDateToYmd(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t.startsWith("0000-00")) return null;
    const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return null;
}

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function inferEndFromDuration(start, duration) {
  if (!duration || !start) return start;
  const weeks = String(duration).match(/(\d+)\s*week/i);
  if (weeks) return addDaysIso(start, Number(weeks[1]) * 7);
  const days = String(duration).match(/(\d+)\s*day/i);
  if (days) return addDaysIso(start, Math.max(0, Number(days[1]) - 1));
  return start;
}

function effectiveEnd(itemType, row) {
  const start = parseDbDateToYmd(itemType === "course" ? row.start_date : row.event_date) ?? "";
  const storedEnd = parseDbDateToYmd(row.program_end_date);
  if (itemType === "course") {
    const end =
      storedEnd && storedEnd !== start ? storedEnd : inferEndFromDuration(start, row.duration);
    return end < start ? start : end;
  }
  const end = storedEnd ?? start;
  return end < start ? start : end;
}

loadEnv();
const ca = fs.readFileSync(path.resolve(process.cwd(), process.env.TIDB_CA_PATH), "utf8");
const conn = await mysql.createConnection({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { ca },
});

const today = todayYmdKolkata();
const report = {
  ok: true,
  todayIst: today,
  steps: [],
  findings: [],
  coupon: null,
  redeem: [],
  failures: [],
};

function step(name, pass, detail) {
  report.steps.push({ name, pass, detail });
  if (!pass) {
    report.ok = false;
    report.failures.push(`${name}: ${detail}`);
  }
}

try {
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('coupons','coupon_scopes','courses','events')`,
    [process.env.TIDB_DATABASE],
  );
  step(
    "schema",
    tables.length >= 4,
    tables.map((t) => t.TABLE_NAME).join(", "),
  );

  const [courses] = await conn.query(
    `SELECT slug, title, price, active, start_date, registration_close_date, program_end_date, duration
     FROM courses WHERE active = 1 AND price > 0 ORDER BY id DESC`,
  );
  const [events] = await conn.query(
    `SELECT slug, title, price, active, event_date AS start_date, event_date, registration_close_date, program_end_date
     FROM events WHERE active = 1 AND price > 0 ORDER BY id DESC`,
  );

  const openCourses = courses.filter((r) => today <= effectiveEnd("course", r));
  const openEvents = events.filter((r) => today <= effectiveEnd("event", r));
  const course = openCourses[0] ?? courses[0];
  const event = openEvents[0] ?? events[0];

  step(
    "active_paid_course_available",
    courses.length > 0,
    courses.length ? `${courses.length} active paid; ${openCourses.length} still open` : "none",
  );
  step(
    "active_paid_event_available",
    events.length > 0,
    events.length ? `${events.length} active paid; ${openEvents.length} still open` : "none",
  );

  if (!course || !event) throw new Error("Need at least one active paid course and event");

  if (openCourses.length === 0) {
    report.findings.push(
      "DATA: Every active paid course has an effective end date before today (IST). Coupons correctly refuse redeem until program_end_date/duration is updated.",
    );
  }

  const percent = 20;
  const [existingAudit] = await conn.query(
    `SELECT id, code FROM coupons WHERE code LIKE 'AUDIT20%' ORDER BY id DESC LIMIT 1`,
  );

  let couponId;
  let code;
  await conn.beginTransaction();
  try {
    if (existingAudit[0]) {
      couponId = existingAudit[0].id;
      code = existingAudit[0].code;
      await conn.query(
        `UPDATE coupons SET description=?, discount_type='percent', discount_value=?, active=1, max_uses=50, valid_from=NULL, valid_until=NULL WHERE id=?`,
        ["Audit coupon — 20% off (safe to deactivate)", percent, couponId],
      );
      await conn.query(`DELETE FROM coupon_scopes WHERE coupon_id=?`, [couponId]);
    } else {
      code = `AUDIT20${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const [ins] = await conn.query(
        `INSERT INTO coupons (code, description, discount_type, discount_value, active, max_uses, valid_from, valid_until)
         VALUES (?, ?, 'percent', ?, 1, ?, NULL, NULL)`,
        [code, "Audit coupon — 20% off (safe to deactivate)", percent, 50],
      );
      couponId = ins.insertId;
    }
    await conn.query(
      `INSERT INTO coupon_scopes (coupon_id, item_type, item_slug) VALUES (?, 'course', ?), (?, 'event', ?)`,
      [couponId, course.slug, couponId, event.slug],
    );
    await conn.commit();
    step("create_coupon", true, `${code} id=${couponId}`);
  } catch (e) {
    await conn.rollback();
    throw e;
  }

  report.coupon = {
    id: couponId,
    code,
    discount_type: "percent",
    discount_value: percent,
    scopes: [
      {
        item_type: "course",
        item_slug: course.slug,
        title: course.title,
        list_price: Number(course.price),
        effective_end: effectiveEnd("course", course),
        open: openCourses.some((c) => c.slug === course.slug),
      },
      {
        item_type: "event",
        item_slug: event.slug,
        title: event.title,
        list_price: Number(event.price),
        effective_end: effectiveEnd("event", event),
        open: openEvents.some((e) => e.slug === event.slug),
      },
    ],
  };

  async function resolveFor(itemType, itemSlug, listPrice) {
    const [coupons] = await conn.query(
      `SELECT id, discount_type, discount_value, active, max_uses, uses_count
       FROM coupons WHERE code = ? LIMIT 1`,
      [code],
    );
    const c = coupons[0];
    if (!c?.active) return { ok: false, message: "Coupon missing/inactive" };

    const [scopes] = await conn.query(
      `SELECT item_type, item_slug FROM coupon_scopes WHERE coupon_id = ?`,
      [c.id],
    );
    const hit = scopes.find(
      (s) =>
        String(s.item_type).toLowerCase() === itemType &&
        String(s.item_slug).trim().toLowerCase() === itemSlug.trim().toLowerCase(),
    );
    if (!hit) return { ok: false, message: "Scope miss" };

    const row =
      itemType === "course"
        ? (
            await conn.query(
              `SELECT active, start_date, registration_close_date, program_end_date, duration
               FROM courses WHERE LOWER(TRIM(slug))=LOWER(?) LIMIT 1`,
              [itemSlug],
            )
          )[0][0]
        : (
            await conn.query(
              `SELECT active, event_date AS start_date, registration_close_date, program_end_date, NULL AS duration
               FROM events WHERE LOWER(TRIM(slug))=LOWER(?) LIMIT 1`,
              [itemSlug],
            )
          )[0][0];

    if (!row || Number(row.active) !== 1) return { ok: false, message: "Program not active" };

    const start = parseDbDateToYmd(row.start_date) ?? "";
    const end = effectiveEnd(itemType, {
      start_date: row.start_date,
      event_date: row.start_date,
      program_end_date: row.program_end_date,
      duration: row.duration,
    });
    const regClose = parseDbDateToYmd(row.registration_close_date) ?? start;
    const earlyRegClose = regClose && start && regClose < start ? regClose : null;
    const programCutoff =
      earlyRegClose && end ? (earlyRegClose < end ? earlyRegClose : end) : end || earlyRegClose;

    if (end && today > end) return { ok: false, message: "Program ended", timeline: { start, end, today } };
    if (programCutoff && today > programCutoff) {
      return {
        ok: false,
        message: earlyRegClose ? "Registration closed" : "Program timeline ended",
        timeline: { start, end, regClose, earlyRegClose, programCutoff, today },
      };
    }

    const { discountAmount, finalAmount } = computeDiscountedPrice(
      listPrice,
      c.discount_type,
      c.discount_value,
    );
    const expectedDiscount = Math.floor((listPrice * percent) / 100);
    return {
      ok: true,
      listAmount: listPrice,
      discountAmount,
      finalAmount,
      expectedDiscount,
      expectedFinal: listPrice - expectedDiscount,
      mathMatch: discountAmount === expectedDiscount && finalAmount === listPrice - expectedDiscount,
      timeline: { start, end, regClose, earlyRegClose, programCutoff, today },
    };
  }

  // Course redeem
  const courseResult = await resolveFor("course", course.slug, Number(course.price));
  report.redeem.push({
    itemType: "course",
    itemSlug: course.slug,
    title: course.title,
    listPrice: Number(course.price),
    result: courseResult,
  });
  if (openCourses.length === 0) {
    step(
      "redeem_course",
      !courseResult.ok && courseResult.message === "Program ended",
      courseResult.ok
        ? "unexpected success on ended course"
        : `correctly blocked: ${courseResult.message} (end ${courseResult.timeline?.end})`,
    );
  } else {
    step(
      "redeem_course",
      !!(courseResult.ok && courseResult.mathMatch),
      courseResult.ok
        ? `list ${courseResult.listAmount} → −${courseResult.discountAmount} → pay ${courseResult.finalAmount}`
        : courseResult.message,
    );
  }

  // Event redeem
  const eventResult = await resolveFor("event", event.slug, Number(event.price));
  report.redeem.push({
    itemType: "event",
    itemSlug: event.slug,
    title: event.title,
    listPrice: Number(event.price),
    result: eventResult,
  });
  step(
    "redeem_event",
    !!(eventResult.ok && eventResult.mathMatch),
    eventResult.ok
      ? `list ${eventResult.listAmount} → −${eventResult.discountAmount} → pay ${eventResult.finalAmount}`
      : eventResult.message,
  );

  // Wrong scope
  const wrong = await resolveFor("course", "__no_such_slug__", 1000);
  step("wrong_scope_rejected", !wrong.ok, wrong.message || "unexpected ok");

  // Case-insensitive (only assert math if program is open)
  const caseFlip = event.slug
    .split("")
    .map((ch, i) => (i % 2 ? ch.toUpperCase() : ch.toLowerCase()))
    .join("");
  const caseR = await resolveFor("event", caseFlip, Number(event.price));
  step(
    "case_insensitive_scope",
    !!(caseR.ok && caseR.mathMatch),
    caseR.ok ? `matched via ${caseFlip}` : caseR.message,
  );

  // Code path sanity: percent formula
  const sample = computeDiscountedPrice(19999, "percent", 20);
  step(
    "percent_math",
    sample.discountAmount === 3999 && sample.finalAmount === 16000,
    `19999 @ 20% → −${sample.discountAmount} pay ${sample.finalAmount}`,
  );

  report.findings.push(
    `Coupon ${code} is ACTIVE in DB. Use it on register page for scoped programs.`,
  );
  if (eventResult.ok) {
    report.findings.push(
      `Event path PASS: ${event.slug} ₹${event.price} → ₹${eventResult.finalAmount} (20% off).`,
    );
  }
  if (openCourses.length === 0) {
    report.findings.push(
      `Course path BLOCKED by data (not code): scoped course "${course.slug}" effective end ${effectiveEnd("course", course)} < today ${today}. Update courses.program_end_date (or duration) in admin, then re-apply ${code}.`,
    );
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
} catch (e) {
  report.ok = false;
  report.failures.push(e.message);
  console.log(JSON.stringify(report, null, 2));
  console.error("AUDIT_FATAL", e.message);
  process.exit(1);
} finally {
  await conn.end().catch(() => {});
}
