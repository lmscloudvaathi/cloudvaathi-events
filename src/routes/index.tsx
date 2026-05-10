import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Cpu, GraduationCap, LayoutList, Rocket, Sparkles, Users, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { formatINR } from "@/lib/mock-data";
import { getCoursesFn, getEventsFn } from "@/lib/rpc";
import { useSessionUser } from "@/hooks/use-session-user";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [courses, events] = await Promise.all([getCoursesFn(), getEventsFn()]);
    return { courses, events };
  },
  head: () => ({
    meta: [
      { title: "Cloud Vaathi — Live cloud, DevOps & AI infra cohorts" },
      { name: "description", content: "Live cohorts, workshops and tech events for the cloud generation. Learn AWS, Kubernetes, Terraform and ship production systems." },
      { property: "og:title", content: "Cloud Vaathi" },
      { property: "og:description", content: "Live cloud, DevOps & AI infra cohorts." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { courses, events } = Route.useLoaderData();
  const { user, loading: sessionLoading } = useSessionUser();
  const featuredCourses = courses.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const signedIn = !sessionLoading && !!user;

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      {/* HERO */}
      <section className="relative px-4 sm:px-6 pt-20 pb-28">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse-glow" />
            New cohort · June 2026 · Limited seats
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Engineer the
            <span className="text-gradient-neon"> cloud generation</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Live cohorts, hands-on workshops and tech events to take you from kubectl to platform team.
            Built by practitioners who ship at scale.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/courses"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-neon px-7 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
            >
              Explore courses <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground hover:border-primary"
            >
              <Calendar className="h-4 w-4" /> Upcoming events
            </Link>
          </div>

          {/* Stats strip */}
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

      {/* FEATURES */}
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
              { icon: Users, title: "Career network", body: "Get matched with hiring partners, mock interviews and an alumni Slack of 12k+ engineers." },
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

      {/* COURSES */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// upcoming cohorts</p>
              <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Featured courses</h2>
            </div>
            <Link to="/courses" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featuredCourses.map((c) => (
              <Link
                key={c.slug}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:glow-violet"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-neon opacity-10 blur-2xl transition-opacity group-hover:opacity-30" />
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{c.level}</span>
                  <span className="text-xs text-muted-foreground">{c.duration}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold leading-tight">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.tagline}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-display text-2xl font-bold text-gradient-neon">{formatINR(c.price)}</span>
                  <span className="text-xs text-muted-foreground">{c.seats - c.enrolled} seats left</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// happening soon</p>
              <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Tech events & workshops</h2>
            </div>
            <Link to="/events" className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              All events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.map((e) => (
              <div key={e.slug} className="neon-border p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">{e.type}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{e.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{e.venue}</p>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatINR(e.price)}</span>
                  <Link to="/events" className="text-xs font-semibold text-primary hover:underline">Details →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl glass p-12 text-center glow-violet">
          {signedIn ? (
            <>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">Welcome back</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Explore live cohorts and tech events, or open your registrations to continue where you left off.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-neon px-8 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
                >
                  Browse courses <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                  <Calendar className="h-4 w-4" /> View events
                </Link>
              </div>
              <Link
                to="/my-registrations"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <LayoutList className="h-4 w-4" /> My registrations
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">Ready to ship at cloud scale?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Join the next cohort and build with engineers from across India. Limited seats — register early.
              </p>
              <Link
                to="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-neon px-8 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
              >
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
