import { Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatINR } from "@/lib/mock-data";
import type { getCoursesFn, getEventsFn } from "@/lib/rpc";

type CatalogData = {
  courses: Awaited<ReturnType<typeof getCoursesFn>>;
  events: Awaited<ReturnType<typeof getEventsFn>>;
};

function formatStartDate(value: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function EventsCatalog({ courses, events }: CatalogData) {
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-20 pb-12">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// register</p>
          <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">Courses &amp; events</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse live cohorts and upcoming workshops in one place. Select a program to view details and register.
          </p>
        </div>
      </section>

      <section id="courses" className="scroll-mt-24 px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// courses</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Live cohorts</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div
                key={c.slug}
                className="group relative flex flex-col overflow-hidden rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:glow-violet"
              >
                <div className="flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold leading-snug">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.tagline}</p>
                <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {c.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> {c.enrolled}/{c.seats}
                  </span>
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
        </div>
      </section>

      <section id="events" className="scroll-mt-24 px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// events</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Workshops &amp; tech events</h2>
          </div>
          <div className="space-y-5">
            {events.map((e) => (
              <div
                key={e.slug}
                className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:border-primary/60 md:p-8"
              >
                <div className="grid gap-6 md:grid-cols-[180px_1fr_auto] md:items-center">
                  <div className="flex flex-col items-start gap-2 rounded-xl bg-gradient-neon p-5 text-primary-foreground glow-cyan md:max-w-[160px]">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">{e.type}</span>
                    <span className="font-display text-3xl font-bold leading-none">
                      {new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit" })}
                    </span>
                    <span className="text-sm font-semibold uppercase">
                      {new Date(e.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold">{e.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {e.time}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {e.venue}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> {e.registered}/{e.seats}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-display text-2xl font-bold text-gradient-neon">{formatINR(e.price)}</span>
                    <Link
                      to="/events/$slug"
                      params={{ slug: e.slug }}
                      className="inline-flex items-center gap-2 rounded-md border border-border/60 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60"
                    >
                      View details
                    </Link>
                    <Link
                      to="/register/$slug"
                      params={{ slug: e.slug }}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
