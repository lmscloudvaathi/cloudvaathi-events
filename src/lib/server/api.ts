import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureDatabaseReady } from "./migrate";
import { listCourses, listEvents, getCourseBySlug } from "./catalog";
import { signUpSchema, verifyOtpSchema, loginSchema, createOrderSchema, confirmPaymentSchema } from "./validation";
import { createUser, decodeSessionToken, issueSessionToken, loginUser } from "./auth";
import { consumeOtp, generateOtp } from "./otp";
import { sendOtpEmail } from "./mailer";
import { verifyUserOtp } from "./auth";
import { createOrder, confirmPayment } from "./payments";
import { adminListCourses, adminListEvents, getAdminStats, listParticipants } from "./admin";

export const getCoursesFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureDatabaseReady();
  return listCourses();
});

export const getEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  await ensureDatabaseReady();
  return listEvents();
});

export const getCourseFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    return getCourseBySlug(data.slug);
  });

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    await createUser(data);
    const code = await generateOtp(data.email);
    await sendOtpEmail(data.email, code);
    return { ok: true };
  });

export const resendOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const code = await generateOtp(data.email);
    await sendOtpEmail(data.email, code);
    return { ok: true };
  });

export const verifyOtpFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifyOtpSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const valid = await consumeOtp(data.email, data.code);
    if (!valid) throw new Error("Invalid or expired OTP");
    await verifyUserOtp(data.email);
    return { ok: true };
  });

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = await loginUser(data.email, data.password);
    if (!user) throw new Error("Invalid credentials or email not verified");
    const token = issueSessionToken(user);
    return { token, user };
  });

export const meFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    return { user };
  });

export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user) throw new Error("Unauthorized");
    return createOrder({ userId: user.id, itemType: data.itemType, itemSlug: data.itemSlug });
  });

export const confirmPaymentFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => confirmPaymentSchema.parse(data))
  .handler(async ({ data }) => {
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
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return getAdminStats();
  });

export const adminParticipantsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return listParticipants();
  });

export const adminCoursesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminListCourses();
  });

export const adminEventsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await ensureDatabaseReady();
    const user = decodeSessionToken(data.token);
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return adminListEvents();
  });
