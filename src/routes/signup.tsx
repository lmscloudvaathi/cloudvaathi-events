import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AuroraBg } from "@/components/aurora-bg";
import { Spinner } from "@/components/spinner";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { resendOtpFn, signupFn, verifyOtpFn } from "@/lib/rpc";

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
              setLoading(true);
              try {
                if (step === "signup") {
                  await signupFn({ data: form });
                  setStep("otp");
                } else {
                  await verifyOtpFn({ data: { email: form.email, code: otp } });
                  const next = safeRedirectPath(redirect);
                  navigate({ to: "/login", search: next ? { redirect: next } : {} });
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Request failed");
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
                <Field
                  icon={Mail}
                  label="Enter OTP from email"
                  type="text"
                  value={otp}
                  onChange={setOtp}
                  placeholder="6-digit OTP"
                />
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={async () => {
                    await resendOtpFn({ data: { email: form.email } });
                  }}
                >
                  Resend OTP
                </button>
              </>
            )}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}

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
