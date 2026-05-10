import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, CreditCard, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSessionUser } from "@/hooks/use-session-user";
import { enrollmentItemTypeMatches, enrollmentSlugMatches, normalizeEnrollmentPaymentStatus } from "@/lib/enrollment-utils";
import { myEnrollmentsFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export type ItemEnrollmentCtaProps = {
  itemType: "course" | "event";
  slug: string;
  registerLabel?: string;
};

const kindLabel = (t: "course" | "event") => (t === "course" ? "course" : "event");

export function ItemEnrollmentCta({ itemType, slug, registerLabel = "Register" }: ItemEnrollmentCtaProps) {
  const { user, loading: sessionLoading } = useSessionUser();
  const [checking, setChecking] = useState(false);
  const [enrollment, setEnrollment] = useState<
    { payment_status: "Paid" | "Pending" | "Refunded"; amount: number; registered_at: string } | null | undefined
  >(undefined);

  useEffect(() => {
    if (!user) {
      setEnrollment(undefined);
      return;
    }
    const token = getSessionToken();
    if (!token) {
      setEnrollment(null);
      return;
    }

    let cancelled = false;
    setEnrollment(undefined);

    function load() {
      const t = getSessionToken();
      if (!t || cancelled) return;
      setChecking(true);
      myEnrollmentsFn({ data: { token: t } })
        .then((rows) => {
          if (cancelled) return;
          const row = rows.find(
            (r) =>
              enrollmentItemTypeMatches(r.item_type, itemType) && enrollmentSlugMatches(r.item_slug, slug),
          );
          setEnrollment(
            row
              ? {
                  payment_status: normalizeEnrollmentPaymentStatus(row.payment_status),
                  amount: row.amount,
                  registered_at: row.registered_at,
                }
              : null,
          );
        })
        .catch(() => {
          if (!cancelled) setEnrollment(null);
        })
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    }

    load();
    window.addEventListener("cv-auth-change", load);
    return () => {
      cancelled = true;
      window.removeEventListener("cv-auth-change", load);
    };
  }, [user?.id, slug, itemType]);

  const loadingEnrollment = Boolean(user && (checking || enrollment === undefined));

  if (sessionLoading || loadingEnrollment) {
    return <div className="mt-6 h-24 animate-pulse rounded-lg bg-muted/30" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-center text-[11px] text-muted-foreground">
          Sign in or create an account to register (payment only if this {kindLabel(itemType)} has a fee).
        </p>
        <Link
          to="/login"
          search={{ redirect: `/register/${slug}` }}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-black"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          search={{ redirect: `/register/${slug}` }}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground"
        >
          Create account
        </Link>
      </div>
    );
  }

  if (enrollment?.payment_status === "Paid") {
    return (
      <div className="mt-6 rounded-xl border border-neon-cyan/35 bg-neon-cyan/5 p-5 text-left">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon-cyan/20">
            <CheckCircle2 className="h-5 w-5 text-neon-cyan" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-foreground">You&apos;re enrolled</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Your registration for this {kindLabel(itemType)} is confirmed
              {enrollment.amount > 0 ? " and payment is complete" : ""}. Check your email for next steps.
            </p>
            <Link
              to="/my-registrations"
              className="mt-3 inline-flex text-xs font-semibold text-neon-cyan hover:underline"
            >
              View my registrations →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (enrollment?.payment_status === "Pending") {
    return (
      <div className="mt-6 rounded-xl border border-amber-500/35 bg-amber-500/5 p-5 text-left">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <CreditCard className="h-5 w-5 text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-foreground">
              {enrollment.amount > 0 ? "Payment pending" : "Enrollment not finalized"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {enrollment.amount > 0
                ? "You’ve started registration — complete checkout on the registration page to secure your seat."
                : "Finish confirming your details on the registration page to complete your free enrollment."}
            </p>
            <Link
              to="/register/$slug"
              params={{ slug }}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:underline"
            >
              Continue registration <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (enrollment?.payment_status === "Refunded") {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-left">
          <div className="flex gap-3">
            <RotateCcw className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Previous enrollment refunded</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can register again below if seats are still available.
              </p>
            </div>
          </div>
        </div>
        <RegisterLink slug={slug} registerLabel={registerLabel} itemType={itemType} />
      </div>
    );
  }

  return <RegisterLink slug={slug} registerLabel={registerLabel} itemType={itemType} />;
}

function RegisterLink({
  slug,
  registerLabel,
  itemType,
}: {
  slug: string;
  registerLabel: string;
  itemType: "course" | "event";
}) {
  return (
    <Link
      to="/register/$slug"
      params={{ slug }}
      className={`mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-black glow-cyan transition-transform hover:scale-[1.02] ${
        itemType === "course" ? "gap-2" : ""
      }`}
    >
      {registerLabel}
      {itemType === "course" ? <ArrowRight className="h-4 w-4" /> : null}
    </Link>
  );
}
