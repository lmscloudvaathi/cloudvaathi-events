import { createFileRoute } from "@tanstack/react-router";
import { AuroraBg } from "@/components/aurora-bg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials & achievements — Cloud Vaathi" },
      {
        name: "description",
        content: "Stories from engineers and professionals who trained with Cloud Vaathi across certifications and cohorts.",
      },
    ],
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
