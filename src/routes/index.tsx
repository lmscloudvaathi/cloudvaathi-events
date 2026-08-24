import { createFileRoute } from "@tanstack/react-router";
import { EventsCatalog } from "@/components/events-catalog";
import { MarketingHome } from "@/components/marketing-home";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { resolveSiteMode } from "@/lib/resolve-site-mode";
import { HERO_HEADLINE } from "@/lib/site-config";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";
import { getCoursesFn, getEventsFn } from "@/lib/rpc";

export const Route = createFileRoute("/")({
  loader: async () => {
    const siteMode = await resolveSiteMode();
    const [courses, events] = await Promise.all([getCoursesFn(), getEventsFn()]);
    return { siteMode, courses, events };
  },
  head: ({ loaderData }) => {
    const siteMode = loaderData?.siteMode ?? "events";
    const siteBaseUrl = siteBaseUrlForMode(siteMode);
    if (siteMode === "marketing") {
      return {
        meta: buildSocialMeta({
          siteBaseUrl,
          title: `Cloud Vaathi — ${HERO_HEADLINE}`,
          description:
            "Founded by Sivva Kannan. Live cohorts, certification prep, and tech events that turn cloud, cybersecurity, and AI into career-ready capability.",
        }),
      };
    }
    return {
      meta: buildSocialMeta({
        siteBaseUrl,
        title: "Courses & Events — Cloud Vaathi",
        description:
          "Browse live cloud cohorts and upcoming workshops. Register for courses and tech events with Cloud Vaathi.",
      }),
    };
  },
  pendingComponent: RoutePendingFallback,
  component: IndexPage,
});

function IndexPage() {
  const data = Route.useLoaderData();

  if (data.siteMode === "marketing") {
    return <MarketingHome courses={data.courses} events={data.events} />;
  }

  return <EventsCatalog courses={data.courses} events={data.events} />;
}
