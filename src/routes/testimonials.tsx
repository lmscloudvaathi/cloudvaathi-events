import { createFileRoute } from "@tanstack/react-router";
import { AuroraBg } from "@/components/aurora-bg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/testimonials")({
  head: ({ match }) => ({
    meta: buildSocialMeta({
      siteBaseUrl: siteBaseUrlForMode(match.context.siteMode ?? "marketing"),
      title: "Testimonials & achievements — Cloud Vaathi",
      description:
        "Stories from engineers and professionals who trained with Cloud Vaathi across certifications and cohorts.",
      path: "/testimonials",
    }),
  }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <div className="pt-8">
        <TestimonialsCarousel />
      </div>
      <SiteFooter />
    </div>
  );
}
