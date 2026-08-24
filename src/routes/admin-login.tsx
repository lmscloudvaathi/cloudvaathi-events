import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AuroraBg } from "@/components/aurora-bg";
import { Spinner } from "@/components/spinner";
import { adminLoginFn } from "@/lib/rpc";
import { setSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Admin sign in — Cloud Vaathi" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-2xl glass p-8 glow-violet">
          <div className="flex items-center gap-2 text-neon-cyan">
            <Shield className="h-5 w-5" />
            <p className="font-mono text-xs uppercase tracking-[0.3em]">// admin console</p>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">Administrator sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the admin account from your server configuration. This is separate from member sign-in.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              adminLoginFn({ data: { email, password } })
                .then((res) => {
                  setSessionToken(res.token);
                  navigate({ to: "/admin" });
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : "Login failed");
                })
                .finally(() => setLoading(false));
            }}
          >
            <Field icon={Mail} label="Admin email" type="email" value={email} onChange={setEmail} placeholder="admin@yourcompany.com" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? <Spinner className="text-primary-foreground" /> : null}
              Sign in to admin <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Member or student?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Regular sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
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
