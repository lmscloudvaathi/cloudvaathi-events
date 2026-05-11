import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Lock, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AuroraBg } from "@/components/aurora-bg";
import { Spinner } from "@/components/spinner";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { formatINR } from "@/lib/mock-data";
import { loadRegisterFormDraft, saveRegisterFormDraft } from "@/lib/register-form-storage";
import { confirmPaymentFn, completeFreeEnrollmentFn, createOrderFn, getCheckoutConfigFn, getCourseFn, getEventsFn, myEnrollmentsFn, startRegistrationFn, validateCouponFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";
import { enrollmentItemTypeMatches, enrollmentSlugMatches, normalizeEnrollmentPaymentStatus } from "@/lib/enrollment-utils";
import { useSessionUser } from "@/hooks/use-session-user";

function formatDate(value: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const Route = createFileRoute("/register/$slug")({
  loader: async ({ params }) => {
    const [course, events] = await Promise.all([getCourseFn({ data: { slug: params.slug } }), getEventsFn()]);
    const event = events.find((e) => e.slug === params.slug) ?? null;
    if (!course && !event) throw notFound();
    return { course, event };
  },
  head: () => ({ meta: [{ title: "Register — Cloud Vaathi" }] }),
  pendingComponent: RoutePendingFallback,
  component: RegisterPage,
  notFoundComponent: () => <div className="p-10 text-center">Item not found</div>,
});

function RegisterPage() {
  const { course, event } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { user, loading: userLoading } = useSessionUser();
  const item = course ?? event;
  const itemType = useMemo(() => (course ? "course" : "event"), [course]);
  const isFree = useMemo(() => (item?.price ?? 0) <= 0, [item?.price]);
  const [done, setDone] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", org: "" });
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<
    { payment_status: "Paid" | "Pending" | "Refunded"; amount: number } | null | undefined
  >(undefined);
  const [draftReady, setDraftReady] = useState(false);
  const formInitKey = useRef<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [appliedPricing, setAppliedPricing] = useState<{
    listAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  const effectivePrice = appliedPricing?.finalAmount ?? item?.price ?? 0;

  useEffect(() => {
    formInitKey.current = null;
    setDraftReady(false);
    setCouponInput("");
    setCouponError("");
    setAppliedPricing(null);
  }, [slug]);

  useEffect(() => {
    if (isFree) return;
    getCheckoutConfigFn()
      .then((c) => setRazorpayKeyId(c.razorpayKeyId))
      .catch(() => setRazorpayKeyId(null));
  }, [isFree]);

  useEffect(() => {
    function sync() {
      setHasSession(!!getSessionToken());
      setSessionChecked(true);
    }
    sync();
    window.addEventListener("cv-auth-change", sync);
    return () => window.removeEventListener("cv-auth-change", sync);
  }, []);

  useEffect(() => {
    if (!sessionChecked || !hasSession || !item) {
      if (!hasSession) setExistingEnrollment(undefined);
      return;
    }
    const token = getSessionToken();
    if (!token) {
      setExistingEnrollment(null);
      return;
    }

    let cancelled = false;

    function refreshFromRows(rows: Awaited<ReturnType<typeof myEnrollmentsFn>>) {
      const row = rows.find(
        (r) =>
          enrollmentItemTypeMatches(r.item_type, itemType) && enrollmentSlugMatches(r.item_slug, item.slug),
      );
      setExistingEnrollment(
        row
          ? {
              payment_status: normalizeEnrollmentPaymentStatus(row.payment_status),
              amount: row.amount,
            }
          : null,
      );
    }

    function load() {
      const t = getSessionToken();
      if (!t || cancelled) return;
      setExistingEnrollment(undefined);
      myEnrollmentsFn({ data: { token: t } })
        .then((rows) => {
          if (!cancelled) refreshFromRows(rows);
        })
        .catch(() => {
          if (!cancelled) setExistingEnrollment(null);
        });
    }

    load();
    window.addEventListener("cv-auth-change", load);
    return () => {
      cancelled = true;
      window.removeEventListener("cv-auth-change", load);
    };
  }, [sessionChecked, hasSession, item, itemType]);

  useEffect(() => {
    if (existingEnrollment?.payment_status === "Pending" && existingEnrollment.amount > 0) {
      setRegistered(true);
    }
  }, [existingEnrollment]);

  const fieldsLocked = existingEnrollment?.payment_status === "Pending";

  /** Prefill + restore draft from localStorage (merged with profile). */
  useEffect(() => {
    if (existingEnrollment === undefined || !item || userLoading) return;
    if (!user) {
      setDraftReady(true);
      return;
    }
    const key = `${user.id}:${item.slug}`;
    if (formInitKey.current === key) return;
    formInitKey.current = key;
    const saved = loadRegisterFormDraft(user.id, item.slug);
    setForm({
      name: saved?.name ?? user.name ?? "",
      email: saved?.email ?? user.email ?? "",
      phone: saved?.phone ?? user.phone ?? "",
      org: saved?.org ?? "",
    });
    setDraftReady(true);
  }, [user, userLoading, item, existingEnrollment]);

  /** Persist draft while editing (after hydration). */
  useEffect(() => {
    if (!draftReady || !user || !item || fieldsLocked) return;
    const t = window.setTimeout(() => {
      saveRegisterFormDraft(user.id, item.slug, form);
    }, 350);
    return () => window.clearTimeout(t);
  }, [form, draftReady, user, item, fieldsLocked]);

  async function applyCoupon() {
    setCouponError("");
    if (!item || isFree) return;
    const token = getSessionToken();
    if (!token) {
      setCouponError("Please sign in to apply a coupon.");
      return;
    }
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code.");
      setAppliedPricing(null);
      return;
    }
    setCouponApplying(true);
    try {
      const r = await validateCouponFn({
        data: { token, itemType, itemSlug: item.slug, couponCode: code },
      });
      if (!r.ok) {
        setCouponError(r.message);
        setAppliedPricing(null);
        return;
      }
      setAppliedPricing({
        listAmount: r.listAmount,
        discountAmount: r.discountAmount,
        finalAmount: r.finalAmount,
      });
    } catch (e) {
      setCouponError(e instanceof Error ? e.message : "Coupon check failed");
      setAppliedPricing(null);
    } finally {
      setCouponApplying(false);
    }
  }

  async function onFreeEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!item) return;
    const token = getSessionToken();
    if (!token) {
      setError("Please sign in.");
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill name, email and phone.");
      return;
    }
    try {
      setLoading(true);
      await completeFreeEnrollmentFn({
        data: { token, itemType, itemSlug: item.slug },
      });
      if (user) saveRegisterFormDraft(user.id, item.slug, form);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setLoading(false);
    }
  }

  async function onPay(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!item) return;
    if (!registered) {
      setError("Please register first, then continue to payment.");
      return;
    }
    const token = getSessionToken();
    if (!token) {
      setError("Please login before checkout.");
      return;
    }
    try {
      setLoading(true);
      const order = await createOrderFn({
        data: {
          token,
          itemType,
          itemSlug: item.slug,
          couponCode: appliedPricing ? couponInput.trim() : undefined,
        },
      });
      if (order.paidViaFullCoupon) {
        setDone(true);
        return;
      }
      if (!order.razorpayOrderId) {
        throw new Error("Could not start payment session.");
      }
      if (!razorpayKeyId) {
        throw new Error("Checkout is not configured (missing Razorpay key).");
      }
      const RazorpayCtor = (window as typeof window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!RazorpayCtor) {
        throw new Error("Razorpay SDK missing. Add checkout script.");
      }
      const instance = new RazorpayCtor({
        key: razorpayKeyId,
        amount: order.amount * 100,
        currency: "INR",
        name: "Cloud Vaathi",
        description: `Cloud Vaathi ${itemType} registration`,
        order_id: order.razorpayOrderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await confirmPaymentFn({ data: { token, ...response } });
          setDone(true);
        },
      });
      instance.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!item) return;
    const token = getSessionToken();
    if (!token) {
      setError("Please sign in and complete registration before payment.");
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill name, email and phone.");
      return;
    }
    try {
      setLoading(true);
      const res = await startRegistrationFn({
        data: {
          token,
          itemType,
          itemSlug: item.slug,
          couponCode: appliedPricing ? couponInput.trim() : undefined,
        },
      });
      if (res.alreadyEnrolled) {
        setError("You are already enrolled.");
        return;
      }
      if ("autoCompletedWithCoupon" in res && res.autoCompletedWithCoupon) {
        if (user) saveRegisterFormDraft(user.id, item.slug, form);
        setDone(true);
        return;
      }
      if (user) saveRegisterFormDraft(user.id, item.slug, form);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <SiteHeader />
        <div className="flex justify-center px-4 py-24">
          <div className="h-48 w-full max-w-lg animate-pulse rounded-2xl bg-muted/30" />
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return <GuestRegisterGate slug={slug} course={course} event={event} />;
  }

  if (existingEnrollment === undefined || userLoading) {
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <SiteHeader />
        <div className="flex justify-center px-4 py-24">
          <div className="h-48 w-full max-w-lg animate-pulse rounded-2xl bg-muted/30" />
        </div>
      </div>
    );
  }

  if (existingEnrollment?.payment_status === "Paid") {
    return (
      <RegistrationSuccessView
        itemTitle={item?.title}
        mode="already"
        backTo={course ? `/courses/${slug}` : `/events/${slug}`}
      />
    );
  }

  if (done) {
    return <RegistrationSuccessView itemTitle={item?.title} mode="success" />;
  }

  if (!draftReady) {
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <SiteHeader />
        <div className="flex justify-center px-4 py-24">
          <div className="h-48 w-full max-w-lg animate-pulse rounded-2xl bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">
              {isFree ? "// free enrollment" : "// secure checkout"}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold">
              {isFree ? "Confirm your enrollment" : "Register, then pay"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isFree
                ? "This course or event has no fee. Submit your details to confirm your seat — we’ll email you right away."
                : "Step 1 registers your seat. Step 2 opens secure payment."}
            </p>
            {fieldsLocked ? (
              <p className="mt-3 rounded-lg border border-neon-cyan/25 bg-neon-cyan/5 px-3 py-2 text-xs text-muted-foreground">
                These details are saved for your registration and stay filled when you return. While payment is pending,
                they&apos;re read-only.
              </p>
            ) : null}

            <form
              className="mt-8 space-y-5 rounded-2xl glass p-6"
              onSubmit={isFree ? onFreeEnroll : registered ? onPay : onRegister}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  placeholder="Vaathi Coming"
                  value={form.name}
                  readOnly={fieldsLocked}
                  onChange={(value) => setForm((s) => ({ ...s, name: value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@cloud.dev"
                  value={form.email}
                  readOnly={fieldsLocked}
                  onChange={(value) => setForm((s) => ({ ...s, email: value }))}
                />
                <Input
                  label="WhatsApp"
                  type="tel"
                  placeholder="+91 90000 00000"
                  value={form.phone}
                  readOnly={fieldsLocked}
                  onChange={(value) => setForm((s) => ({ ...s, phone: value }))}
                />
                <Input
                  label="Company / College"
                  placeholder="Optional"
                  required={false}
                  value={form.org}
                  readOnly={fieldsLocked}
                  onChange={(value) => setForm((s) => ({ ...s, org: value }))}
                />
              </div>

              {!isFree ? (
                <div className="rounded-lg border border-border/50 bg-surface/40 p-4 space-y-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Coupon</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponInput}
                      disabled={loading || couponApplying}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError("");
                      }}
                      className="flex-1 rounded-lg border border-border/60 bg-input/40 px-3 py-2 text-sm uppercase placeholder:normal-case"
                    />
                    <button
                      type="button"
                      disabled={loading || couponApplying}
                      onClick={() => void applyCoupon()}
                      className="inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-2 text-xs font-semibold text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-60"
                    >
                      {couponApplying ? <Spinner className="text-neon-cyan" /> : null}
                      {couponApplying ? "Checking…" : "Apply"}
                    </button>
                    {appliedPricing ? (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline"
                        onClick={() => {
                          setAppliedPricing(null);
                          setCouponError("");
                        }}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {couponError ? <p className="text-[11px] text-destructive">{couponError}</p> : null}
                  {appliedPricing ? (
                    <p className="text-[11px] text-muted-foreground">
                      Coupon applied — you pay <span className="font-semibold text-foreground">{formatINR(appliedPricing.finalAmount)}</span>{" "}
                      (save {formatINR(appliedPricing.discountAmount)}).
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Optional. Must match this {itemType}.</p>
                  )}
                </div>
              ) : null}

              {isFree ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? <Spinner className="text-primary-foreground" /> : null}
                  {loading ? "Enrolling…" : "Complete free enrollment"}
                </button>
              ) : !registered ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? <Spinner className="text-primary-foreground" /> : null}
                  {loading ? "Registering…" : "Register seat"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? <Spinner className="text-primary-foreground" /> : <Lock className="h-4 w-4" />}
                  {loading ? "Opening checkout…" : `Pay ${formatINR(effectivePrice)}`}
                </button>
              )}
              {error ? <p className="text-center text-[11px] text-destructive">{error}</p> : null}
            </form>
          </div>

          <aside className="self-start rounded-2xl glass p-6">
            <h3 className="font-display text-lg font-semibold">Order summary</h3>
            <div className="mt-4 rounded-lg bg-surface/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{itemType}</p>
              <p className="mt-1 font-semibold">{item?.title}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {course
                  ? `Starts ${formatDate(course.startDate)} · ${course.duration}`
                  : `${event?.date} · ${event?.time}`}
              </p>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <Row label="List price" value={formatINR(item?.price ?? 0)} />
              {!isFree && appliedPricing && appliedPricing.discountAmount > 0 ? (
                <Row label="Coupon" value={`−${formatINR(appliedPricing.discountAmount)}`} />
              ) : null}
              <Row label="GST" value={isFree ? "—" : "incl."} />
            </div>
            <div className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-gradient-neon">{formatINR(isFree ? 0 : effectivePrice)}</span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function RegistrationSuccessView({
  itemTitle,
  mode,
  backTo,
}: {
  itemTitle?: string;
  mode: "success" | "already";
  backTo?: string;
}) {
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg rounded-2xl glass p-10 text-center glow-cyan">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon glow-cyan">
            <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">{mode === "already" ? "You're enrolled" : "You're in!"}</h1>
          <p className="mt-3 text-muted-foreground">
            {mode === "already" ? (
              <>
                You&apos;re already confirmed for{" "}
                <span className="font-semibold text-foreground">{itemTitle ?? "this offering"}</span>. You don&apos;t need to
                enroll again — check your email or open your registrations for details.
              </>
            ) : (
              <>
                Registration confirmed for <span className="font-semibold text-foreground">{itemTitle}</span>.
              </>
            )}
          </p>
          <div className="mt-6 mx-auto max-w-sm text-left">
            <div className="rounded-lg bg-surface/60 p-4">
              <Mail className="h-4 w-4 text-neon-cyan" />
              <p className="mt-2 text-xs text-muted-foreground">Confirmation email sent</p>
            </div>
          </div>
          <Link to="/my-registrations" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
            View my registrations →
          </Link>
          {backTo ? (
            <div className="mt-4">
              <Link to={backTo} className="text-xs text-muted-foreground hover:text-primary">
                ← Back to course or event
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GuestRegisterGate({
  slug,
  course,
  event,
}: {
  slug: string;
  course: { title: string } | null;
  event: { title: string } | null;
}) {
  const item = course ?? event;
  const backTo = course ? `/courses/${slug}` : `/events/${slug}`;
  const redirectPath = `/register/${slug}`;

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <section className="flex justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl glass p-8 text-center glow-violet">
          <h1 className="font-display text-2xl font-bold">Sign in to register</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in or create an account to register for{" "}
            <span className="font-semibold text-foreground">{item?.title}</span>. Pricing is shown on the detail page — free items enroll without payment.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/login"
              search={{ redirect: redirectPath }}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-black"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              search={{ redirect: redirectPath }}
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold"
            >
              Create account
            </Link>
          </div>
          <Link to={backTo} className="mt-8 inline-block text-xs text-muted-foreground hover:text-primary">
            ← Back to details
          </Link>
        </div>
      </section>
    </div>
  );
}

function Input({
  label,
  type = "text",
  placeholder,
  required = true,
  value,
  readOnly = false,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(e) => {
          if (readOnly) return;
          onChange?.(e.target.value);
        }}
        className={`w-full rounded-lg border border-border/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          readOnly ? "cursor-default bg-muted/30 opacity-95" : "bg-input/40"
        }`}
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
