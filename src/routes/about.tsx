import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";
import { FounderPortrait } from "@/components/founder-portrait";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FOUNDER_INTRO, FOUNDER_NAME, FOUNDER_ROLE, CREDENTIAL_SNAPSHOT, TRUST_STATS } from "@/lib/site-config";
import { JumpLink } from "@/components/jump-link";
import { eventsHref, useSiteMode } from "@/lib/site-mode";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";

export const Route = createFileRoute("/about")({
  head: ({ match }) => ({
    meta: buildSocialMeta({
      siteBaseUrl: siteBaseUrlForMode(match.context.siteMode ?? "marketing"),
      title: `${FOUNDER_NAME} — ${FOUNDER_ROLE}`,
      description: FOUNDER_INTRO,
      path: "/about",
    }),
  }),
  component: AboutPage,
});

const PROFILE_POINTS = [
  {
    title: "Industry practice",
    body: "More than a decade of hands-on work in cybersecurity and cloud security, including roles at organizations such as Accenture and EY.",
  },
  {
    title: "Teaching that transfers",
    body: "Complex cloud, cybersecurity, and AI concepts are taught as applied capability — so professionals can perform on the job, not only pass an exam.",
  },
  {
    title: "Credentials, held not displayed",
    body: "40+ professional credentials across cloud, security, and related domains. The number is the record; programs are built around what those credentials require in practice.",
  },
] as const;

function AboutPage() {
  const siteMode = useSiteMode();
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />

      <section id="founder" className="scroll-mt-24 px-4 sm:px-6 pt-16 pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <FounderPortrait size="page" className="lg:sticky lg:top-24" />

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// founder</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{FOUNDER_NAME}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{FOUNDER_ROLE}</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{FOUNDER_INTRO}</p>

            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {TRUST_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{s.value}</dd>
                  <p className="mt-1 text-[11px] font-medium uppercase leading-snug tracking-[0.12em] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-12 space-y-8">
              {PROFILE_POINTS.map((p) => (
                <div key={p.title}>
                  <h2 className="font-display text-lg font-semibold">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>

            <section id="credentials" className="mt-14 scroll-mt-24">
              <h2 className="font-display text-2xl font-bold">Credentials</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sivva holds 40+ professional credentials. This page names a representative set used in teaching and
                mentoring — not a complete badge collage.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...CREDENTIAL_SNAPSHOT, "CISA", "CRISC", "CGEIT", "CDPSE", "CCZT", "CCSK"].map((code) => (
                  <div
                    key={code}
                    className="flex items-center justify-center rounded-xl border border-border/60 bg-surface/40 px-3 py-4"
                  >
                    <span className="font-display text-sm font-bold tracking-wide">{code}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <JumpLink
                href={eventsHref(siteMode, "/#upcoming")}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-neon px-7 py-3.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-105"
              >
                Explore Upcoming Programs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </JumpLink>
              <Link
                to="/testimonials"
                className="inline-flex items-center justify-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground hover:border-primary"
              >
                Read learner stories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
