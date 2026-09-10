import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Mic } from "lucide-react";
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
  eventToHubProgram,
  formatProgramDate,
  isFounderMentor,
  programSeatMessage,
  programStatus,
} from "@/lib/program-lifecycle";
import { prerequisitesForEvent, softwareFromCatalog } from "@/lib/program-syllabus";
import { getEventFn } from "@/lib/rpc";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/events/$slug")({
  loader: async ({ params }) => {
    const event = await getEventFn({ data: { slug: params.slug } });
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData, match, params }) => {
    if (!loaderData) return { meta: [] };
    const siteMode = match.context.siteMode ?? "events";
    const siteBaseUrl = siteBaseUrlForMode(siteMode);
    const description =
      loaderData.event.description.length > 200
        ? `${loaderData.event.description.slice(0, 197)}…`
        : loaderData.event.description;
    return {
      meta: buildSocialMeta({
        siteBaseUrl,
        title: `${loaderData.event.title} — Cloud Vaathi`,
        description,
        path: `/events/${params.slug}`,
      }),
    };
  },
  pendingComponent: () => <RoutePendingFallback compact />,
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  const program = eventToHubProgram(event);
  const status = programStatus(program);
  const founder = isFounderMentor(program.mentorName);
  const software = softwareFromCatalog({
    title: event.title,
    description: event.description,
    venue: event.venue,
  });
  const prerequisites = prerequisitesForEvent(event.type, event.venue);

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
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
          >
            ← All events
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                  {program.category}
                </span>
                <ProgramStatusBadge status={status} />
                <span className="rounded-full bg-secondary/40 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {event.type}
                </span>
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{event.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{event.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Meta icon={Calendar} label="Date" value={formatProgramDate(program.startDate)} />
                <Meta icon={Clock} label="Time" value={event.time || "TBD"} />
                <Meta icon={MapPin} label="Venue" value={event.venue} />
                <Meta icon={Mic} label="Availability" value={programSeatMessage(program)} />
              </div>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Mentor / speakers</h2>
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
                    ) : null}
                    {event.speakers.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                        {event.speakers.map((s) => (
                          <li key={s} className="flex items-center gap-2">
                            <Mic className="h-3.5 w-3.5 text-neon-cyan" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Expected final outcome</h2>
                <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Prerequisites</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>

              {software.length > 0 ? (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold">Required software / accounts</h2>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {software.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Curriculum, labs and assessments</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  This listing is an event, not a multi-week course. The catalog does not store a module list, lab
                  roster or exam outline for it. What you get is the live session described above.
                </p>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-bold">Sample session</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {program.category === "AI & GenAI"
                    ? "AI demo for this track. Opens on click. No autoplay. Captions can be enabled in the player."
                    : "Cloud demo for this track. Opens on click. No autoplay. Captions can be enabled in the player."}
                </p>
                <div className="mt-4 max-w-xl">
                  <SampleSessionButton variant="card" category={program.category} />
                </div>
              </section>
            </div>

            <aside className="self-start rounded-2xl glass p-6 glow-violet lg:sticky lg:top-24">
              <GatedPrice
                amount={event.price}
                size="hero"
                signedInHint={event.price <= 0 ? "Free · open to all" : "Per participant"}
              />
              <div className="my-5 h-px bg-border/60" />
              <ProgramDetailCta program={program} />
            </aside>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl glass p-4">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
