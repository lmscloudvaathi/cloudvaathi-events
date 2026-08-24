import { useMemo, useState } from "react";
import { AuroraBg } from "@/components/aurora-bg";
import { ProgramCard } from "@/components/program-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTACT_EMAIL, FOUNDER_NAME } from "@/lib/site-config";
import { lmsSiteUrl } from "@/lib/site-mode-shared";
import {
  PROGRAM_CATEGORIES,
  courseToHubProgram,
  eventToHubProgram,
  formatProgramDate,
  programStatus,
  waitlistMailto,
  type HubProgram,
  type ProgramCategory,
  type ProgramStatus,
} from "@/lib/program-lifecycle";
import type { getCoursesFn, getEventsFn } from "@/lib/rpc";

type CatalogData = {
  courses: Awaited<ReturnType<typeof getCoursesFn>>;
  events: Awaited<ReturnType<typeof getEventsFn>>;
};

type StatusFilter = "upcoming" | ProgramStatus | "all";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "in_progress", label: "In Progress" },
  { id: "registration_closed", label: "Registration Closed" },
  { id: "completed", label: "Past Events" },
];

function byStart(a: HubProgram, b: HubProgram) {
  return String(a.startDate ?? "").localeCompare(String(b.startDate ?? ""));
}

export function EventsCatalog({ courses, events }: CatalogData) {
  const programs = useMemo(() => {
    const list = [
      ...courses.map(courseToHubProgram),
      ...events.map(eventToHubProgram),
    ];
    return list.sort(byStart);
  }, [courses, events]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("upcoming");
  const [categoryFilter, setCategoryFilter] = useState<ProgramCategory | "all">("all");

  const filtered = programs.filter((p) => {
    const st = programStatus(p);
    if (statusFilter !== "all" && st !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  const upcoming = programs.filter((p) => programStatus(p) === "upcoming");
  const inProgress = programs.filter((p) => programStatus(p) === "in_progress");
  const closed = programs.filter((p) => programStatus(p) === "registration_closed");
  const past = programs.filter((p) => programStatus(p) === "completed");

  const showStacked = statusFilter === "upcoming" && categoryFilter === "all";

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 pt-20 pb-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// programs</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">Upcoming Programs &amp; Events</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Live cohorts, certification bootcamps and mentor-led sessions in Cloud, Cybersecurity, AI and Architecture —
            led by {FOUNDER_NAME} and the Cloud Vaathi team.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Program status">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? "bg-gradient-neon text-black"
                    : "border border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Category">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                categoryFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All categories
            </button>
            {PROGRAM_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                  categoryFilter === c ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {showStacked ? (
        <>
          <UpcomingByCategory items={upcoming} />
          {inProgress.length > 0 ? (
            <ProgramSection id="in-progress" title="In Progress" items={inProgress} />
          ) : null}
          {closed.length > 0 ? (
            <ProgramSection id="registration-closed" title="Registration Closed" items={closed} />
          ) : null}
        </>
      ) : (
        <ProgramSection
          id="results"
          title={STATUS_TABS.find((t) => t.id === statusFilter)?.label ?? "Programs"}
          items={filtered}
          empty="No programs match these filters."
        />
      )}

      <section id="past" className="scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <details className="rounded-2xl glass p-6" open={statusFilter === "completed"}>
            <summary className="cursor-pointer font-display text-2xl font-bold">Past Events</summary>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed programs stay listed for credibility. They are not open for registration.
            </p>
            {past.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No past events in the catalog yet.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {past.map((p) => (
                  <li key={`${p.kind}-${p.slug}`} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-3">
                    <div>
                      <a href={p.href} className="font-semibold hover:text-primary">
                        {p.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {p.category} · {formatRange(p)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-3xl glass p-8 text-center sm:p-12">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Don&apos;t see a cohort that fits your schedule?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join the waitlist for the next intake or continue learning on the LMS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={waitlistMailto("Next Cloud Vaathi intake")}
              className="inline-flex rounded-full bg-gradient-neon px-7 py-3 text-sm font-semibold text-black"
            >
              Join Waitlist
            </a>
            <a
              href={lmsSiteUrl()}
              className="inline-flex rounded-full border border-border px-7 py-3 text-sm font-semibold"
            >
              Open the LMS
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Waitlist requests go to <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This
            does not create an enrollment.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function UpcomingByCategory({ items }: { items: HubProgram[] }) {
  return (
    <section id="upcoming" className="scroll-mt-24 px-4 py-12 sm:px-6">
      <span id="courses" className="sr-only" />
      <span id="events" className="sr-only" />
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-3xl font-bold">Upcoming Programs</h2>
        <p className="mt-2 text-sm text-muted-foreground">Grouped by category from each course and program name.</p>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No upcoming programs right now. Join the waitlist for the next intake.
          </p>
        ) : (
          PROGRAM_CATEGORIES.map((cat) => {
            const group = items.filter((p) => p.category === cat);
            if (group.length === 0) return null;
            return (
              <div key={cat} className="mt-10">
                <h3 className="font-display text-xl font-semibold text-neon-cyan">{cat}</h3>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.map((p) => (
                    <ProgramCard key={`${p.kind}-${p.slug}`} program={p} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatRange(p: HubProgram) {
  const start = formatProgramDate(p.startDate);
  if (p.startDate === p.endDate) return start;
  return `${start} – ${formatProgramDate(p.endDate)}`;
}

function ProgramSection({
  id,
  extraIds,
  title,
  items,
  empty,
}: {
  id: string;
  extraIds?: string[];
  title: string;
  items: HubProgram[];
  empty?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-12 sm:px-6">
      {extraIds?.map((extraId) => (
        <span key={extraId} id={extraId} className="sr-only" />
      ))}
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{empty ?? "Nothing in this section right now."}</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProgramCard key={`${p.kind}-${p.slug}`} program={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
