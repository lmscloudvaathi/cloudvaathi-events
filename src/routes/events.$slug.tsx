import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Clock, Mic } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { EventEnrollmentCta } from "@/components/event-enrollment-cta";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { formatINR } from "@/lib/mock-data";
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
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-16 pb-10">
        <div className="mx-auto max-w-6xl">
          <Link to="/events" className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">
            ← All events
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                {event.type}
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{event.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{event.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Meta icon={Calendar} label="Date" value={new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                <Meta icon={Clock} label="Time" value={event.time || "TBD"} />
                <Meta icon={MapPin} label="Venue" value={event.venue} />
                <Meta icon={Users} label="Capacity" value={`${event.registered}/${event.seats} registered`} />
              </div>

              <h2 className="mt-12 font-display text-2xl font-bold">Speakers & agenda</h2>
              <ul className="mt-5 space-y-3">
                {(event.speakers.length ? event.speakers : ["Community speaker line-up"]).map((speaker) => (
                  <li key={speaker} className="flex items-center gap-2 rounded-lg glass p-3 text-sm">
                    <Mic className="h-4 w-4 text-neon-cyan" />
                    {speaker}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-24 self-start rounded-2xl glass p-6 glow-violet">
              <div className="font-display text-4xl font-bold text-gradient-neon">{formatINR(event.price)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.price <= 0 ? "Free · open to all" : "Per participant"}
              </p>
              <div className="my-5 h-px bg-border/60" />
              <EventEnrollmentCta
                key={event.slug}
                slug={event.slug}
                registerLabel={event.price <= 0 ? "Register free" : "Register & pay"}
              />
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
