import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/privacy")({
  head: ({ match }) => ({
    meta: buildSocialMeta({
      siteBaseUrl: siteBaseUrlForMode(match.context.siteMode ?? "marketing"),
      title: "Privacy — Cloud Vaathi",
      description: "How Cloud Vaathi handles personal information collected on this site.",
      path: "/privacy",
    }),
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy">
      <p>
        Cloud Vaathi collects account details (name, email, phone) and enrollment records so we can register you for
        programs you choose, send confirmations, and run the LMS. We do not sell learner lists.
      </p>
      <p>
        Payments are processed by Razorpay. We store order references and payment status needed for enrollment — not
        your full card number.
      </p>
      <p>
        Questions:{" "}
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <p className="text-xs text-muted-foreground">
        This page describes current site behaviour. It is not a substitute for a lawyer-reviewed policy.
      </p>
    </LegalShell>
  );
}
