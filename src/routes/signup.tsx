import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Inbox, Lock, Mail, Phone, User } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuroraBg } from "@/components/aurora-bg";
import { Spinner } from "@/components/spinner";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { formatUserFacingError } from "@/lib/form-errors";
import { isSignupDuplicateEmailError, SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE } from "@/lib/signup-constants";
import { resendOtpFn, signupFn, verifyOtpFn } from "@/lib/rpc";
import { firstZodIssueMessage, signUpSchema } from "@/lib/validation";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Create account — Cloud Vaathi" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl glass p-8 glow-violet">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// new identity</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Join Cloud Vaathi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free account · register for any course or event.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setResendNotice("");
              setLoading(true);
              try {
                if (step === "signup") {
                  const parsed = signUpSchema.safeParse(form);
                  if (!parsed.success) {
                    setError(firstZodIssueMessage(parsed.error));
                    return;
                  }
                  await signupFn({ data: parsed.data });
                  setStep("otp");
                } else {
                  await verifyOtpFn({ data: { email: form.email, code: otp } });
                  const next = safeRedirectPath(redirect);
                  navigate({ to: "/login", search: next ? { redirect: next } : {} });
                }
              } catch (err) {
                const msg = formatUserFacingError(err);
                if (isSignupDuplicateEmailError(msg)) {
                  setError(SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE);
                } else {
                  setError(msg);
                }
              } finally {
                setLoading(false);
              }
            }}
          >
            {step === "signup" ? (
              <>
                <Field icon={User} label="Full name" type="text" value={form.name} onChange={set("name")} placeholder="Vaathi Coming" />
                <Field icon={Mail} label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@cloud.dev" />
                <Field icon={Phone} label="WhatsApp number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 90000 00000" />
                <Field icon={Lock} label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
              </>
            ) : (
              <>
                <div className="flex gap-3 rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
                  <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-neon-cyan" aria-hidden />
                  <div>
                    <p className="font-medium text-foreground">Verification email sent</p>
                    <p className="mt-1.5">
                      We’ve sent a one-time code to{" "}
                      <span className="break-all font-mono text-foreground/90">{form.email}</span>. It may take a minute
                      to arrive. If you don’t see it, check your <span className="text-foreground/90">spam or junk</span>{" "}
                      folder, or the <span className="text-foreground/90">Promotions</span> tab if you use Gmail.
                    </p>
                    <p className="mt-2 text-xs">
                      Still nothing after a few minutes? Use <span className="font-medium text-foreground">Resend OTP</span>{" "}
                      below, and confirm the address is correct.
                    </p>
                  </div>
                </div>
                <Field
                  icon={Mail}
                  label="Enter OTP from email"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  placeholder="6-digit OTP"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    disabled={resendLoading}
                    className="text-left text-xs font-medium text-primary hover:underline disabled:opacity-60"
                    onClick={async () => {
                      setError("");
                      setResendNotice("");
                      setResendLoading(true);
                      try {
                        await resendOtpFn({ data: { email: form.email } });
                        setResendNotice(
                          "A new code has been sent. Please check your inbox and spam or promotions folders again.",
                        );
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Could not resend code");
                      } finally {
                        setResendLoading(false);
                      }
                    }}
                  >
                    {resendLoading ? "Sending…" : "Resend OTP"}
                  </button>
                  {resendNotice ? <p className="text-xs text-muted-foreground sm:max-w-[14rem] sm:text-right">{resendNotice}</p> : null}
                </div>
              </>
            )}
            {error && isSignupDuplicateEmailError(error) ? (
              <div
                className="rounded-xl border border-border/80 bg-secondary/30 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground"
                role="alert"
              >
                <p className="text-foreground/95">{SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE}</p>
                <p className="mt-3">
                  <Link
                    to="/login"
                    search={redirect ? { redirect } : {}}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Go to sign in <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            ) : null}
            {error && !isSignupDuplicateEmailError(error) ? <p className="text-xs text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? <Spinner className="text-primary-foreground" /> : null}
              {step === "signup" ? "Create account" : "Verify OTP"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link
              to="/login"
              search={redirect ? { redirect } : {}}
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({ icon: Icon, label, type, value, onChange, placeholder }: { icon: React.ComponentType<{ className?: string }>; label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border/60 bg-input/40 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </label>
  );
}
