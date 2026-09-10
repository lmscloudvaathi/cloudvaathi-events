import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  confirmPaymentSchema,
  createOrderSchema,
  loginSchema,
  signUpSchema,
  validateCouponSchema,
  verifyOtpSchema,
} from "./validation";

export const getCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureDatabaseReady } = await import("./server/migrate");
  const { listCourses } = await import("./server/catalog");
  await ensureDatabaseReady();
  return listCourses();
});

export const getEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureDatabaseReady } = await import("./server/migrate");
  const { listEvents } = await import("./server/catalog");
  await ensureDatabaseReady();
  return listEvents();
});

export const getCourseFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { getCourseBySlug } = await import("./server/catalog");
    await ensureDatabaseReady();
    return getCourseBySlug(data.slug);
  });

export const getEventFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { getEventBySlug } = await import("./server/catalog");
    await ensureDatabaseReady();
    return getEventBySlug(data.slug);
  });

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit } = await import("./server/rate-limit");
    const { createUser } = await import("./server/auth");
    const { generateOtp } = await import("./server/otp");
    const { sendOtpEmail } = await import("./server/mailer");
    await ensureDatabaseReady();
    assertRateLimit(`signup:${data.email.toLowerCase()}`, 5, 15 * 60 * 1000);
    await createUser(data);
    const code = await generateOtp(data.email);
    await sendOtpEmail(data.email, code);
    return { ok: true };
  });

export const resendOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit } = await import("./server/rate-limit");
    const { generateOtp } = await import("./server/otp");
    const { sendOtpEmail } = await import("./server/mailer");
    await ensureDatabaseReady();
    assertRateLimit(`resend:${data.email.toLowerCase()}`, 5, 15 * 60 * 1000);
    const code = await generateOtp(data.email);
    await sendOtpEmail(data.email, code);
    return { ok: true };
  });

export const verifyOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifyOtpSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit } = await import("./server/rate-limit");
    const { consumeOtp } = await import("./server/otp");
    const { verifyUserOtp } = await import("./server/auth");
    await ensureDatabaseReady();
    assertRateLimit(`verify:${data.email.toLowerCase()}`, 10, 15 * 60 * 1000);
    const valid = await consumeOtp(data.email, data.code);
    if (!valid) throw new Error("Invalid or expired OTP");
    await verifyUserOtp(data.email);
    return { ok: true };
  });

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit } = await import("./server/rate-limit");
    const { loginUser, issueSessionToken } = await import("./server/auth");
    await ensureDatabaseReady();
    assertRateLimit(`login:${data.email.toLowerCase()}`, 12, 15 * 60 * 1000);
    const user = await loginUser(data.email, data.password);
    if (!user) throw new Error("Invalid credentials or email not verified");
    const token = issueSessionToken(user);
    return { token, user };
  });

export const adminLoginFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit } = await import("./server/rate-limit");
    const { loginAdminUser, issueSessionToken } = await import("./server/auth");
    await ensureDatabaseReady();
    assertRateLimit(`admin-login:${data.email.toLowerCase()}`, 8, 15 * 60 * 1000);
    const user = await loginAdminUser(data.email, data.password);
    if (!user) throw new Error("Invalid admin email or password");
    const token = issueSessionToken(user);
    return { token, user };
  });

export const meFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    await ensureDatabaseReady();
    return { user: decodeSessionToken(data.token) };
  });

export const myEnrollmentsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { listMyEnrollments } = await import("./server/my-enrollments");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return listMyEnrollments(user.id);
  });

export const getMyItemEnrollmentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(1),
        itemType: z.enum(["course", "event"]),
        itemSlug: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit, rateLimitTokenKey } = await import("./server/rate-limit");
    const { decodeSessionToken } = await import("./server/auth");
    const { getEnrollmentForItem } = await import("./server/my-enrollments");
    await ensureDatabaseReady();
    assertRateLimit(rateLimitTokenKey("item-enrollment", data.token), 80, 10 * 60 * 1000);
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    const enrollment = await getEnrollmentForItem(user.id, data.itemType, data.itemSlug);
    return { enrollment };
  });

export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit, rateLimitTokenKey } = await import("./server/rate-limit");
    const { decodeSessionToken } = await import("./server/auth");
    const { createOrder } = await import("./server/payments");
    await ensureDatabaseReady();
    assertRateLimit(rateLimitTokenKey("create-order", data.token), 30, 10 * 60 * 1000);
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return createOrder({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      itemType: data.itemType,
      itemSlug: data.itemSlug,
      couponCode: data.couponCode,
    });
  });

export const startRegistrationFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit, rateLimitTokenKey } = await import("./server/rate-limit");
    const { decodeSessionToken } = await import("./server/auth");
    const { startRegistration } = await import("./server/payments");
    await ensureDatabaseReady();
    assertRateLimit(rateLimitTokenKey("start-registration", data.token), 30, 10 * 60 * 1000);
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return startRegistration({
      userId: user.id,
      itemType: data.itemType,
      itemSlug: data.itemSlug,
      userEmail: user.email,
      userName: user.name,
      couponCode: data.couponCode,
    });
  });

export const validateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validateCouponSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit, rateLimitTokenKey } = await import("./server/rate-limit");
    const { decodeSessionToken } = await import("./server/auth");
    const { getPurchasableItem } = await import("./server/catalog");
    const { resolveCouponForCheckout } = await import("./server/coupons");
    await ensureDatabaseReady();
    assertRateLimit(rateLimitTokenKey("validate-coupon", data.token), 60, 10 * 60 * 1000);
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    const item = await getPurchasableItem(data.itemType, data.itemSlug);
    if (!item) throw new Error("Item not found");
    if (item.amount <= 0) {
      return { ok: false as const, message: "This item has no fee — no coupon needed." };
    }
    const r = await resolveCouponForCheckout(data.couponCode, data.itemType, data.itemSlug, item.amount);
    if (!r.ok) return { ok: false as const, message: r.message };
    return {
      ok: true as const,
      listAmount: r.listAmount,
      discountAmount: r.discountAmount,
      finalAmount: r.finalAmount,
    };
  });

export const getCheckoutConfigFn = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureDatabaseReady } = await import("./server/migrate");
  const { getEnv } = await import("./server/env");
  await ensureDatabaseReady();
  const env = getEnv();
  return { razorpayKeyId: env.RAZORPAY_KEY_ID };
});

export const completeFreeEnrollmentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { assertRateLimit, rateLimitTokenKey } = await import("./server/rate-limit");
    const { decodeSessionToken } = await import("./server/auth");
    const { completeFreeEnrollment } = await import("./server/payments");
    await ensureDatabaseReady();
    assertRateLimit(rateLimitTokenKey("free-enroll", data.token), 30, 10 * 60 * 1000);
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return completeFreeEnrollment({
      userId: user.id,
      itemType: data.itemType,
      itemSlug: data.itemSlug,
      userEmail: user.email,
      userName: user.name,
    });
  });

export const confirmPaymentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => confirmPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { confirmPayment } = await import("./server/payments");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return confirmPayment({
      ...data,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });
  });

export const adminDashboardFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { getAdminStats } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return getAdminStats();
  });

export const adminParticipantsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { listParticipants } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return listParticipants();
  });

export const adminCoursesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminListCourses } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminListCourses();
  });

export const adminEventsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminListEvents } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminListEvents();
  });

export const adminCreateCourseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        title: z.string().min(3),
        price: z.number().int().nonnegative(),
        seats: z.number().int().positive(),
        startDate: z.string().min(1, "Start date is required"),
        level: z.enum(["Beginner", "Intermediate", "Advanced"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminCreateCourse } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminCreateCourse(data);
    return { ok: true };
  });

export const adminCourseBySlugFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminGetCourseBySlug } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminGetCourseBySlug(data.slug);
  });

export const adminUpdateCourseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        title: z.string().min(3),
        tagline: z.string().min(3),
        description: z.string().min(10),
        level: z.enum(["Beginner", "Intermediate", "Advanced"]),
        duration: z.string().min(2),
        startDate: z.string().min(1),
        price: z.number().int().nonnegative(),
        seats: z.number().int().positive(),
        instructor: z.string().min(2),
        tags: z.array(z.string()),
        modules: z.array(
          z.object({
            title: z.string().min(1),
            lessons: z.array(z.string().min(1)),
          }),
        ),
        registrationOpenDate: z.string().min(1),
        registrationCloseDate: z.string().min(1),
        programEndDate: z.string().min(1),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminUpdateCourse } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminUpdateCourse(data);
    return { ok: true };
  });

export const adminCreateEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        title: z.string().min(3),
        date: z.string().min(1, "Event date is required"),
        type: z.enum(["Workshop", "Tech Talk", "Hackathon", "Meetup"]),
        venue: z.string().min(3),
        price: z.number().int().nonnegative(),
        seats: z.number().int().positive(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminCreateEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminCreateEvent(data);
    return { ok: true };
  });

export const adminCloneEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        slug: z.string().min(1),
        publish: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminCloneEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    const cloned = await adminCloneEvent({
      sourceSlug: data.slug,
      publish: data.publish,
    });
    return { ok: true as const, slug: cloned.slug };
  });

export const adminEventBySlugFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminGetEventBySlug } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminGetEventBySlug(data.slug);
  });

export const adminUpdateEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        slug: z.string(),
        title: z.string().min(3),
        type: z.enum(["Workshop", "Tech Talk", "Hackathon", "Meetup"]),
        date: z.string().min(1),
        time: z.string().min(1),
        venue: z.string().min(3),
        price: z.number().int().nonnegative(),
        seats: z.number().int().positive(),
        description: z.string().min(10),
        speakers: z.array(z.string()),
        registrationOpenDate: z.string().min(1),
        registrationCloseDate: z.string().min(1),
        programEndDate: z.string().min(1),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminUpdateEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminUpdateEvent(data);
    return { ok: true };
  });

export const adminDeleteCourseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminDeactivateCourse } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminDeactivateCourse(data.slug);
    return { ok: true };
  });

export const adminRestoreCourseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminRestoreCourse } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminRestoreCourse(data.slug);
    return { ok: true };
  });

export const adminHardDeleteCourseFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminHardDeleteCourse } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminHardDeleteCourse(data.slug);
    return { ok: true };
  });

export const adminDeleteEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminDeactivateEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminDeactivateEvent(data.slug);
    return { ok: true };
  });

export const adminRestoreEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminRestoreEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminRestoreEvent(data.slug);
    return { ok: true };
  });

export const adminHardDeleteEventFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string(), slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminHardDeleteEvent } = await import("./server/admin");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminHardDeleteEvent(data.slug);
    return { ok: true };
  });

const couponScopeSchema = z.object({
  item_type: z.enum(["course", "event"]),
  item_slug: z.string().min(1).max(140),
});

export const adminCouponsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminListCoupons } = await import("./server/coupons");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminListCoupons();
  });

export const adminCreateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        code: z.string().min(2).max(64),
        description: z.string().max(255).optional(),
        discount_type: z.enum(["percent", "fixed"]),
        discount_value: z.number().int().nonnegative(),
        max_uses: z.number().int().positive().nullable().optional(),
        valid_from: z.string().max(32).nullable().optional(),
        valid_until: z.string().max(32).nullable().optional(),
        scopes: z.array(couponScopeSchema).min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminCreateCoupon } = await import("./server/coupons");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    const { token: _t, ...body } = data;
    await adminCreateCoupon(body);
    return { ok: true };
  });

export const adminUpdateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        id: z.number().int().positive(),
        description: z.string().max(255).optional(),
        discount_type: z.enum(["percent", "fixed"]),
        discount_value: z.number().int().nonnegative(),
        max_uses: z.number().int().positive().nullable().optional(),
        valid_from: z.string().max(32).nullable().optional(),
        valid_until: z.string().max(32).nullable().optional(),
        scopes: z.array(couponScopeSchema).min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminUpdateCoupon } = await import("./server/coupons");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    const { token: _t, ...body } = data;
    await adminUpdateCoupon(body);
    return { ok: true };
  });

export const adminSetCouponActiveFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        id: z.number().int().positive(),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { ensureDatabaseReady } = await import("./server/migrate");
    const { decodeSessionToken } = await import("./server/auth");
    const { adminSetCouponActive } = await import("./server/coupons");
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await adminSetCouponActive(data.id, data.active);
    return { ok: true };
  });
