import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, GraduationCap, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { findCourse, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/courses/$slug")({
  loader: ({ params }) => {
    const course = findCourse(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.course.title} — Cloud Vaathi` },
          { name: "description", content: loaderData.course.tagline },
        ]
      : [],
  }),
  component: CourseDetail,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Course not found</h1>
        <Link to="/courses" className="mt-4 inline-block text-primary hover:underline">Back to courses</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">{error.message}</div>
  ),
});

function CourseDetail() {
  const { course } = Route.useLoaderData();

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-16 pb-10">
        <div className="mx-auto max-w-6xl">
          <Link to="/courses" className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            ← All courses
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2">
                {course.tags.map((t) => (
                  <span key={t} className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">{t}</span>
                ))}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{course.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{course.description}</p>

              <div className="mt-8 flex flex-wrap gap-6 border-y border-border/50 py-5 text-sm">
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {course.duration}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {course.enrolled}/{course.seats} enrolled</span>
                <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> {course.level}</span>
              </div>

              <h2 className="mt-12 font-display text-2xl font-bold">What you'll learn</h2>
              <div className="mt-6 space-y-4">
                {course.modules.map((m, i) => (
                  <div key={i} className="rounded-xl glass p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-neon-cyan">0{i + 1}</span>
                      <h3 className="font-display text-lg font-semibold">{m.title}</h3>
                    </div>
                    <ul className="mt-3 space-y-2 pl-8">
                      {m.lessons.map((l) => (
                        <li key={l} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-neon-cyan" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky enroll card */}
            <aside className="lg:sticky lg:top-24 self-start rounded-2xl glass p-6 glow-violet">
              <div className="font-display text-4xl font-bold text-gradient-neon">{formatINR(course.price)}</div>
              <p className="mt-1 text-xs text-muted-foreground">One-time · GST included</p>

              <div className="my-5 h-px bg-border/60" />

              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Starts</span><span className="font-semibold">{new Date(course.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Instructor</span><span className="font-semibold">{course.instructor}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Seats left</span><span className="font-semibold">{course.seats - course.enrolled}</span></li>
              </ul>

              <Link
                to="/register/$slug"
                params={{ slug: course.slug }}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-neon px-5 py-3 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.02]"
              >
                Register & Pay <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                You'll need to sign in to complete registration.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
