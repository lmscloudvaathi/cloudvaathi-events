import { createFileRoute } from "@tanstack/react-router";
import { EventsCatalog } from "@/components/events-catalog";
import { MarketingHome } from "@/components/marketing-home";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { resolveSiteMode } from "@/lib/resolve-site-mode";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";
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
  head: ({ loaderData }) => {
    const siteMode = loaderData?.siteMode ?? "events";
    const siteBaseUrl = siteBaseUrlForMode(siteMode);
    if (siteMode === "marketing") {
      return {
        meta: buildSocialMeta({
          siteBaseUrl,
          title: "Cloud Vaathi — Learn, Certify, Transform",
          description:
            "Engineer the cloud generation. Live cohorts, certification prep, tech events, and a full LMS for structured learning.",
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
    return <MarketingHome />;
  }

  if (!data.courses || !data.events) {
    return <RoutePendingFallback />;
  }

  return <EventsCatalog courses={data.courses} events={data.events} />;
}
