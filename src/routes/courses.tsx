import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { formatINR } from "@/lib/mock-data";
import { getCoursesFn } from "@/lib/rpc";

function formatStartDate(value: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const Route = createFileRoute("/courses")({
  loader: async () => ({ courses: await getCoursesFn() }),
  head: () => ({
    meta: [
      { title: "Courses — Cloud Vaathi" },
      { name: "description", content: "Browse upcoming live cohorts in cloud, DevOps and platform engineering." },
    ],
  }),
  pendingComponent: RoutePendingFallback,
  component: CoursesPage,
});

function CoursesPage() {
  const location = useLocation();
  const { courses } = Route.useLoaderData();
  if (location.pathname !== "/courses") {
    return <Outlet />;
  }
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <section className="px-4 sm:px-6 pt-20 pb-12">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// courses</p>
          <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">Live cohorts, real outcomes</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Practical, project-based programs taught live by engineers shipping at scale.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c.slug}
              className="group relative flex flex-col overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:glow-violet"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-neon opacity-10 blur-2xl transition-opacity group-hover:opacity-30" />

              <div className="flex flex-wrap gap-2">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">{t}</span>
                ))}
              </div>

              <h3 className="mt-5 font-display text-xl font-bold leading-snug">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.tagline}</p>

              <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {c.duration}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {c.enrolled}/{c.seats}</span>
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-border/50 pt-5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starts</div>
                  <div className="text-sm font-semibold">{formatStartDate(c.startDate)}</div>
                </div>
                <span className="font-display text-2xl font-bold text-gradient-neon">{formatINR(c.price)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/courses/$slug"
                  params={{ slug: c.slug }}
                  className="inline-flex items-center justify-center rounded-md border border-border/60 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                  View details
                </Link>
                <Link
                  to="/register/$slug"
                  params={{ slug: c.slug }}
                  className="inline-flex items-center justify-center rounded-md bg-gradient-neon px-3 py-2 text-xs font-semibold text-black"
                >
                  Register
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
