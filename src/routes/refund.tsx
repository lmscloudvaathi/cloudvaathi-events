import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/refund")({
  head: ({ match }) => ({
    meta: buildSocialMeta({
      siteBaseUrl: siteBaseUrlForMode(match.context.siteMode ?? "marketing"),
      title: "Refunds — Cloud Vaathi",
      description: "How to ask about refunds for Cloud Vaathi enrollments.",
      path: "/refund",
    }),
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalShell title="Refunds">
      <p>
        Refunds, if any, are handled case by case by the Cloud Vaathi team. This site does not automatically issue
        refunds from the learner dashboard.
      </p>
      <p>
        Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your registered email
        and program name. Do not send card details.
      </p>
    </LegalShell>
  );
}
