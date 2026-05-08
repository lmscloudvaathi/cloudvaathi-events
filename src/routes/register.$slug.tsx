import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, CreditCard, Lock, MessageCircle, Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AuroraBg } from "@/components/aurora-bg";
import { findCourse, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/register/$slug")({
  loader: ({ params }) => {
    const course = findCourse(params.slug);
    if (!course) throw notFound();
    return null;
  },
  head: () => ({ meta: [{ title: "Register — Cloud Vaathi" }] }),
  component: RegisterPage,
  notFoundComponent: () => <div className="p-10 text-center">Course not found</div>,
});

function RegisterPage() {
  const { slug } = Route.useParams();
  const course = findCourse(slug)!;
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <SiteHeader />
        <div className="flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-lg rounded-2xl glass p-10 text-center glow-cyan">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon glow-cyan">
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold">You're in!</h1>
            <p className="mt-3 text-muted-foreground">
              Registration confirmed for <span className="font-semibold text-foreground">{course.title}</span>.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-lg bg-surface/60 p-4">
                <Mail className="h-4 w-4 text-neon-cyan" />
                <p className="mt-2 text-xs text-muted-foreground">Confirmation email sent</p>
              </div>
              <div className="rounded-lg bg-surface/60 p-4">
                <MessageCircle className="h-4 w-4 text-neon-cyan" />
                <p className="mt-2 text-xs text-muted-foreground">WhatsApp invite on its way</p>
              </div>
            </div>
            <Link to="/courses" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
              Browse more courses →
            </Link>
          </div>
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
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// secure checkout</p>
            <h1 className="mt-3 font-display text-4xl font-bold">Register & Pay</h1>
            <p className="mt-2 text-muted-foreground">Confirm your details to enroll in this cohort.</p>

            <form
              className="mt-8 space-y-5 rounded-2xl glass p-6"
              onSubmit={(e) => { e.preventDefault(); setDone(true); }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" placeholder="Vaathi Coming" />
                <Input label="Email" type="email" placeholder="you@cloud.dev" />
                <Input label="WhatsApp" type="tel" placeholder="+91 90000 00000" />
                <Input label="Company / College" placeholder="Optional" required={false} />
              </div>

              <div className="border-t border-border/50 pt-5">
                <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" /> Payment
                </h3>
                <Input label="Card number" placeholder="4242 4242 4242 4242" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="Expiry" placeholder="MM / YY" />
                  <Input label="CVC" placeholder="123" />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.01]"
              >
                <Lock className="h-4 w-4" /> Pay {formatINR(course.price)}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                Demo checkout · no real charge will be made.
              </p>
            </form>
          </div>

          <aside className="self-start rounded-2xl glass p-6">
            <h3 className="font-display text-lg font-semibold">Order summary</h3>
            <div className="mt-4 rounded-lg bg-surface/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Course</p>
              <p className="mt-1 font-semibold">{course.title}</p>
              <p className="mt-3 text-xs text-muted-foreground">Starts {new Date(course.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {course.duration}</p>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <Row label="Subtotal" value={formatINR(course.price)} />
              <Row label="GST" value="incl." />
            </div>
            <div className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-gradient-neon">{formatINR(course.price)}</span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Input({ label, type = "text", placeholder, required = true }: { label: string; type?: string; placeholder?: string; required?: boolean; }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/60 bg-input/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
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
