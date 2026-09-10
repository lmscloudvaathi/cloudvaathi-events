import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AuroraBg } from "@/components/aurora-bg";
import { GatedPrice } from "@/components/gated-price";
import { ProgramDetailCta } from "@/components/program-detail-cta";
import { ProgramJsonLd } from "@/components/program-json-ld";
import { ProgramStatusBadge } from "@/components/program-status-badge";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { SampleSessionButton } from "@/components/sample-session";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CREDENTIAL_SNAPSHOT, FOUNDER_INTRO, FOUNDER_PHOTO_PATH, FOUNDER_ROLE } from "@/lib/site-config";
import {
  courseToHubProgram,
  formatProgramDate,
  isFounderMentor,
  programSeatMessage,
  programStatus,
} from "@/lib/program-lifecycle";
import {
  assessmentsFromModules,
  catalogMentionsLabs,
  labsFromModules,
  learningOutcomesFromModules,
  prerequisitesFromCatalog,
  softwareFromCatalog,
} from "@/lib/program-syllabus";
import { getCourseFn } from "@/lib/rpc";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

function formatDate(value: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    const course = await getCourseFn({ data: { slug: params.slug } });
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData, match, params }) => {
    if (!loaderData) return { meta: [] };
    const siteMode = match.context.siteMode ?? "events";
    const siteBaseUrl = siteBaseUrlForMode(siteMode);
    return {
      meta: buildSocialMeta({
        siteBaseUrl,
        title: `${loaderData.course.title} — Cloud Vaathi`,
        description: loaderData.course.tagline,
        path: `/courses/${params.slug}`,
      }),
    };
  },
  pendingComponent: () => <RoutePendingFallback compact />,
  component: CourseDetail,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Course not found</h1>
        <Link to="/" hash="upcoming" className="mt-4 inline-block text-primary hover:underline">
          Back to courses
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">{error.message}</div>
  ),
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const program = courseToHubProgram(course);
  const status = programStatus(program);
  const founder = isFounderMentor(program.mentorName);
  const modules = course.modules ?? [];
  const outcomes = learningOutcomesFromModules(modules);
  const labs = labsFromModules(modules);
  const assessments = assessmentsFromModules(modules);
  const software = softwareFromCatalog({
    title: course.title,
    description: `${course.tagline} ${course.description}`,
    tags: course.tags,
  });
  const prerequisites = prerequisitesFromCatalog(course.level, course.tags);
  const mentionsLabs = catalogMentionsLabs(`${course.tagline} ${course.description}`);

  return (
    <div className="relative min-h-screen">
      <ProgramJsonLd program={program} />
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 pt-16 pb-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            hash="upcoming"
            className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
          >
            ← All courses
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                  {program.category}
                </span>
                <ProgramStatusBadge status={status} />
                {course.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary/40 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{course.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{course.description}</p>

              <div className="mt-8 flex flex-wrap gap-6 border-y border-border/50 py-5 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> {course.duration}
                </span>
                <span className="text-sm font-medium">{programSeatMessage(program)}</span>
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> {course.level}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {program.format} · {formatProgramDate(program.startDate)}
                {program.endDate !== program.startDate ? ` – ${formatProgramDate(program.endDate)}` : ""}
              </p>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Mentor</h2>
                <div className="mt-4 flex gap-4 rounded-xl glass p-4">
                  {founder ? (
                    <img src={FOUNDER_PHOTO_PATH} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
                      {program.mentorName.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{program.mentorName}</p>
                    {founder ? (
                      <>
                        <p className="text-xs text-muted-foreground">{FOUNDER_ROLE}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{FOUNDER_INTRO}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Credentials relevant here: {CREDENTIAL_SNAPSHOT.join(", ")}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Mentor for this cohort as listed in the catalog.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {outcomes.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Learning outcomes</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Taken from this cohort&apos;s stored modules
                    {outcomes.length >= 5 ? " (up to eight items)." : "."}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                        You will be able to work with: {o}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {course.tagline ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Expected final outcome</h2>
                  <p className="mt-3 text-sm text-muted-foreground">{course.tagline}</p>
                </section>
              ) : null}

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Prerequisites</h2>
                <ul className="mt-4 space-y-2">
                  {prerequisites.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>

              {software.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Required software / accounts</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Inferred from this program&apos;s title, tags and description — not a separate inventory table.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {software.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {modules.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Curriculum</h2>
                  <Accordion type="multiple" className="mt-4">
                    {modules.map((m, i) => (
                      <AccordionItem key={m.title} value={`m-${i}`}>
                        <AccordionTrigger>
                          {i + 1}. {m.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {m.lessons.map((l) => (
                              <li key={l}>{l}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ) : null}

              {labs.length > 0 || mentionsLabs ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Labs</h2>
                  {labs.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {labs.map((l) => (
                        <li key={l} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      The catalog copy for this cohort mentions hands-on lab work. Individual lab titles are not stored
                      as a separate list — they sit inside the modules above.
                    </p>
                  )}
                </section>
              ) : null}

              {assessments.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Assessments</h2>
                  <ul className="mt-4 space-y-2">
                    {assessments.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Assessments</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No separate exam or capstone titles are stored for this cohort. Progress is tied to the live sessions
                    and the module outline above.
                  </p>
                </section>
              )}

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Sample session</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {program.category === "AI & GenAI"
                    ? "AI demo matched to this cohort. Thumbnail only until you press play. Captions are available in the player."
                    : "Cloud demo matched to this cohort. Thumbnail only until you press play. Captions are available in the player."}
                </p>
                <div className="mt-4 max-w-xl">
                  <SampleSessionButton variant="card" category={program.category} />
                </div>
              </section>
            </div>

            <aside className="self-start rounded-2xl glass p-6 glow-violet lg:sticky lg:top-24">
              <GatedPrice
                amount={course.price}
                size="hero"
                signedInHint={course.price <= 0 ? "No payment required" : "One-time · GST included"}
              />
              <div className="my-5 h-px bg-border/60" />
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Starts</span>
                  <span className="font-semibold">{formatDate(course.startDate)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-semibold">{course.instructor}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="max-w-[12rem] text-right font-semibold">{programSeatMessage(program)}</span>
                </li>
              </ul>
              <ProgramDetailCta program={program} />
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
