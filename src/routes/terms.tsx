import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/terms")({
  head: ({ match }) => ({
    meta: buildSocialMeta({
      siteBaseUrl: siteBaseUrlForMode(match.context.siteMode ?? "marketing"),
      title: "Terms — Cloud Vaathi",
      description: "Terms for using Cloud Vaathi websites and registering for programs.",
      path: "/terms",
    }),
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms">
      <p>
        These sites let you browse programs and, after you create an account, register and pay for a specific course or
        event. Enrollment is confirmed only when the existing checkout flow records a successful payment (or a free
        enrollment).
      </p>
      <p>
        Program dates, seats and fees are as shown at registration time. Status badges on the events hub are computed
        from program dates on each page load.
      </p>
      <p>
        Contact <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> for seat or scheduling
        questions.
      </p>
    </LegalShell>
  );
}
