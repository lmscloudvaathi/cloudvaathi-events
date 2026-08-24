import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Compass, GraduationCap, Sparkles } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";
import { CohortAvailabilityLabel } from "@/components/cohort-availability-label";
import { FounderPortrait } from "@/components/founder-portrait";
import { SampleSessionButton } from "@/components/sample-session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FEATURED_HOME_TESTIMONIAL } from "@/components/testimonials-carousel";
import { getCohortAvailability } from "@/lib/cohort-availability";
import {
  CREDENTIAL_SNAPSHOT,
  FOUNDER_INTRO,
  HERO_EYEBROW,
  HERO_SUBTEXT,
  TRUST_STATS,
} from "@/lib/site-config";
import { courseLifecycle, eventLifecycle, formatProgramDate, isOpenForHomepage, programDateSortKey } from "@/lib/program-status";
import { eventsSiteUrl, lmsSiteUrl } from "@/lib/site-mode-shared";
import { categoryFromProgramName } from "@/lib/program-lifecycle";
import type { getCoursesFn, getEventsFn } from "@/lib/rpc";

type CatalogLists = {
  courses: Awaited<ReturnType<typeof getCoursesFn>>;
  events: Awaited<ReturnType<typeof getEventsFn>>;
};

type PreviewCard = {
  key: string;
  title: string;
  category: string;
  format: string;
  startDate: string;
  seats: number;
  taken: number;
  detailsHref: string;
  registerHref: string;
};

function upcomingPreview({ courses, events }: CatalogLists): PreviewCard[] {
  const courseCards: PreviewCard[] = courses
    .filter((c) => isOpenForHomepage(courseLifecycle(c)))
    .map((c) => ({
      key: `course-${c.slug}`,
      title: c.title,
      category: categoryFromProgramName(c.title, c.slug),
      format: `Live cohort · ${c.duration}`,
      startDate: programDateSortKey(c.startDate),
      seats: c.seats,
      taken: c.enrolled,
      detailsHref: eventsSiteUrl(`/courses/${encodeURIComponent(c.slug)}`),
      registerHref: eventsSiteUrl(`/register/${encodeURIComponent(c.slug)}`),
    }));

  const eventCards: PreviewCard[] = events
    .filter((e) => isOpenForHomepage(eventLifecycle(e)))
    .map((e) => ({
      key: `event-${e.slug}`,
      title: e.title,
      category: categoryFromProgramName(e.title, e.slug),
      format: e.type,
      startDate: programDateSortKey(e.date),
      seats: e.seats,
      taken: e.registered,
      detailsHref: eventsSiteUrl(`/events/${encodeURIComponent(e.slug)}`),
      registerHref: eventsSiteUrl(`/register/${encodeURIComponent(e.slug)}`),
    }));

  return [...courseCards, ...eventCards]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);
}

function TrustStrip({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="Verified experience and outcomes">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 glass md:grid-cols-4">
        {TRUST_STATS.map((s) => (
          <div key={s.label} className="bg-surface/40 px-4 py-5 sm:px-5 sm:py-6">
            <div className="font-display text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{s.value}</div>
            <div className="mt-1.5 text-[11px] font-medium uppercase leading-snug tracking-[0.12em] text-muted-foreground">
              {s.label}
            </div>
            {"profileLink" in s && s.profileLink ? (
              <Link
                to="/about"
                hash="credentials"
                className="mt-2 inline-block text-[11px] font-medium text-neon-cyan underline-offset-4 hover:underline"
              >
                View all 40+ credentials →
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroActions({ className }: { className?: string }) {
  return (
    <div className={className}>
      <a
        href={eventsSiteUrl("/#upcoming")}
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-neon px-7 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
      >
        Explore Upcoming Programs
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
      <Link
        to="/about"
        hash="founder"
        className="inline-flex items-center justify-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground hover:border-primary"
      >
        Meet Sivva
      </Link>
      <SampleSessionButton />
    </div>
  );
}

const WHY_CARDS = [
  {
    icon: GraduationCap,
    title: "Learn from a Practitioner",
    body: "Training grounded in 14+ years of real cybersecurity and cloud experience across global technology and consulting environments.",
  },
  {
    icon: Compass,
    title: "Understand Before You Memorise",
    body: "Complex concepts broken into clear mental models and guided practice, not memorization shortcuts.",
  },
  {
    icon: BookOpen,
    title: "Prepare With Purpose",
    body: "Certification prep structured around exam thinking, practical understanding and mentor guidance.",
  },
  {
    icon: Sparkles,
    title: "Keep Growing After the Cohort",
    body: "Recordings, LMS access and a learner community that continues beyond the exam date.",
  },
] as const;

export function MarketingHome({ courses, events }: CatalogLists) {
  const preview = upcomingPreview({ courses, events });

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="relative px-4 sm:px-6 pt-14 pb-16 sm:pt-16 lg:pt-20 lg:pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-16 lg:gap-y-8">
          <div className="text-center lg:col-start-1 lg:row-start-1 lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse-glow" />
              {HERO_EYEBROW}
            </p>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Learn deeply. Certify confidently.{" "}
              <span className="text-gradient-neon">Transform your career.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              {HERO_SUBTEXT}
            </p>
          </div>

          <FounderPortrait
            priority
            className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:justify-self-end"
          />

          <TrustStrip className="lg:col-start-1 lg:row-start-2" />

          <HeroActions className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:col-start-1 lg:row-start-3 lg:justify-start" />
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-3xl text-center lg:max-w-7xl lg:text-left">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{FOUNDER_INTRO}</p>
          <Link
            to="/about"
            hash="founder"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neon-cyan underline-offset-4 hover:underline"
          >
            Read the full story →
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// why Cloud Vaathi</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">Why learners choose Cloud Vaathi</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {WHY_CARDS.map((f) => (
              <div key={f.title} className="rounded-2xl glass p-6 transition-all hover:-translate-y-1 hover:border-primary/60">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-neon glow-cyan">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// credentials</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Credential snapshot</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                A selection of credentials Sivva holds and teaches toward — not a complete badge wall.
              </p>
            </div>
            <Link
              to="/about"
              hash="credentials"
              className="text-sm font-semibold text-neon-cyan underline-offset-4 hover:underline"
            >
              View all 40+ credentials →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CREDENTIAL_SNAPSHOT.map((code) => (
              <div
                key={code}
                className="flex min-h-[5.5rem] items-center justify-center rounded-2xl border border-border/60 glass px-3 py-4"
              >
                <span className="font-display text-lg font-bold tracking-wide">{code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// from a learner</p>
          <blockquote className="mt-6 rounded-3xl glass p-8 sm:p-10">
            <p className="text-lg leading-relaxed text-foreground/95 sm:text-xl">
              “{FEATURED_HOME_TESTIMONIAL.quote}”
            </p>
            <footer className="mt-6 border-t border-border/50 pt-5 text-sm text-muted-foreground">
              <cite className="font-display text-base font-semibold not-italic text-foreground">
                {FEATURED_HOME_TESTIMONIAL.name}
              </cite>
              {FEATURED_HOME_TESTIMONIAL.org ? ` · ${FEATURED_HOME_TESTIMONIAL.org}` : null}
            </footer>
          </blockquote>
          <Link
            to="/testimonials"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-neon-cyan underline-offset-4 hover:underline"
          >
            Read more success stories →
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// upcoming</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Upcoming programs</h2>
            </div>
            <a
              href={eventsSiteUrl("/#upcoming")}
              className="text-sm font-semibold text-neon-cyan underline-offset-4 hover:underline"
            >
              View all upcoming →
            </a>
          </div>
          {preview.length === 0 ? (
            <p className="rounded-2xl glass px-6 py-10 text-sm text-muted-foreground">
              New cohorts are being scheduled. Check the programs listing for the current calendar, or join the waitlist
              when a cohort fills.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {preview.map((p) => {
                const full = getCohortAvailability({ seats: p.seats, taken: p.taken, startDate: p.startDate }).kind === "full";
                return (
                  <article key={p.key} className="flex flex-col rounded-2xl glass p-6">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                      {p.category} · {p.format}
                    </p>
                    <h3 className="mt-3 font-display text-lg font-bold leading-snug">{p.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">Starts {formatProgramDate(p.startDate)}</p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      <CohortAvailabilityLabel seats={p.seats} taken={p.taken} startDate={p.startDate} />
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                      <a
                        href={p.detailsHref}
                        className="inline-flex items-center justify-center rounded-md border border-border/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary/60"
                      >
                        View details
                      </a>
                      {full ? (
                        <a
                          href={p.registerHref}
                          className="inline-flex items-center justify-center rounded-md bg-gradient-neon px-3 py-2 text-xs font-semibold text-black"
                        >
                          Join waitlist
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl glass p-12 text-center glow-violet">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Your next capability starts here.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Choose a learning path, join a live cohort, and build the confidence to take the next step in cloud,
            cybersecurity or AI.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={eventsSiteUrl("/#upcoming")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-neon px-8 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
            >
              Explore Upcoming Programs <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={lmsSiteUrl()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
            >
              Open the LMS
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
