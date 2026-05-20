import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { shouldRedirectCatalogListToHome } from "@/lib/site-guards";
import { resolveSiteMode } from "@/lib/resolve-site-mode";
import { Calendar, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { formatINR } from "@/lib/mock-data";
import { getEventsFn } from "@/lib/rpc";

export const Route = createFileRoute("/events")({
  beforeLoad: async ({ location }) => {
    const siteMode = await resolveSiteMode();
    if (shouldRedirectCatalogListToHome(location.pathname, siteMode)) {
      throw redirect({ to: "/", hash: "events" });
    }
  },
  loader: async () => ({ events: await getEventsFn() }),
  head: () => ({
    meta: [
      { title: "Events — Cloud Vaathi" },
      { name: "description", content: "Workshops, hackathons, summits and meetups for the cloud community." },
    ],
  }),
  pendingComponent: RoutePendingFallback,
  component: EventsPage,
});

function EventsPage() {
  const location = useLocation();
  const { events } = Route.useLoaderData();
  if (location.pathname !== "/events") {
    return <Outlet />;
  }
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section className="px-4 sm:px-6 pt-20 pb-12">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// events</p>
          <h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">Workshops & tech events</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Hands-on intensives, hackathons and meetups across India.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-7xl space-y-5">
          {events.map((e) => (
            <div key={e.slug} className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:border-primary/60 md:p-8">
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
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {e.time}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.venue}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {e.registered}/{e.seats}</span>
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
      </section>

      <SiteFooter />
    </div>
  );
}
