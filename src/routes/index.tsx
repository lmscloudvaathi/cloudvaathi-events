import { createFileRoute } from "@tanstack/react-router";
import { EventsCatalog } from "@/components/events-catalog";
import { MarketingHome } from "@/components/marketing-home";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { resolveSiteMode } from "@/lib/resolve-site-mode";
import { getCoursesFn, getEventsFn } from "@/lib/rpc";

export const Route = createFileRoute("/")({
  loader: async () => {
    const siteMode = await resolveSiteMode();
    if (siteMode === "marketing") {
      return { siteMode, courses: null, events: null };
    }
    const [courses, events] = await Promise.all([getCoursesFn(), getEventsFn()]);
    return { siteMode, courses, events };
  },
  head: () => ({
    meta: [
      { title: "Cloud Vaathi — Learn, Certify, Transform" },
      {
        name: "description",
        content: "Cloud Vaathi — live cloud cohorts, certification prep, tech events, and LMS.",
      },
    ],
  }),
  pendingComponent: RoutePendingFallback,
  component: IndexPage,
});

function IndexPage() {
  const data = Route.useLoaderData();

  if (data.siteMode === "marketing") {
    return <MarketingHome />;
  }

  if (!data.courses || !data.events) {
    return <RoutePendingFallback />;
  }

  return <EventsCatalog courses={data.courses} events={data.events} />;
}
