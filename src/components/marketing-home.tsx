import { ArrowRight, Cpu, GraduationCap, Rocket, Sparkles, Users, Zap } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventsSiteUrl, lmsSiteUrl } from "@/lib/site-mode-shared";

export function MarketingHome() {
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="relative px-4 sm:px-6 pt-20 pb-28">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse-glow" />
            Cloud · Certify · Transform
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Engineer the
            <span className="text-gradient-neon"> cloud generation</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Live cohorts, certification prep, and tech events — plus a full LMS for structured learning paths.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href={eventsSiteUrl("/")}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-neon px-7 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
            >
              Browse courses &amp; events <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={lmsSiteUrl()}
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground hover:border-primary"
            >
              Open LMS
            </a>
          </div>

          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 glass md:grid-cols-4">
            {[
              { v: "12k+", l: "Engineers trained" },
              { v: "48", l: "Live cohorts" },
              { v: "92%", l: "Completion rate" },
              { v: "₹18L+", l: "Avg salary hike" },
            ].map((s) => (
              <div key={s.l} className="bg-surface/40 px-6 py-6">
                <div className="font-display text-3xl font-bold text-gradient-neon">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// what you get</p>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">A platform that learns with you</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: GraduationCap, title: "Live cohorts", body: "Weekly live sessions with instructors who run platforms at scale. Recordings included." },
              { icon: Cpu, title: "Real labs", body: "Managed cloud sandboxes, GitOps environments and observability stacks — no setup hell." },
              { icon: Users, title: "Career network", body: "Get matched with hiring partners, mock interviews and an alumni community of 12k+ engineers." },
              { icon: Zap, title: "Workshops", body: "Single-day intensives on focused topics like serverless, IaC, eBPF or GenAI infra." },
              { icon: Rocket, title: "Tech events", body: "Hackathons, summits and meetups in Chennai, Bengaluru & online." },
              { icon: Sparkles, title: "Capstones", body: "Ship a portfolio-worthy project reviewed by senior engineers from top firms." },
            ].map((f) => (
              <div key={f.title} className="group relative rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:border-primary/60">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-neon glow-cyan">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl glass p-12 text-center glow-violet">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Ready to start?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Register for upcoming courses and events on our events portal, or continue your learning journey on the LMS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={eventsSiteUrl("/")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-neon px-8 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
            >
              Go to events portal <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={lmsSiteUrl()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
            >
              Open LMS
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
