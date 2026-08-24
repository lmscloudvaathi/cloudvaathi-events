import { CourseEnrollmentCta } from "@/components/course-enrollment-cta";
import { EventEnrollmentCta } from "@/components/event-enrollment-cta";
import { JumpLink } from "@/components/jump-link";
import {
  notifyReturnMailto,
  programSeatMessage,
  programStatus,
  waitlistMailto,
  type HubProgram,
} from "@/lib/program-lifecycle";

/**
 * Upcoming programs keep the existing enrollment CTA (sign-in → register → pay).
 * Other statuses only change public CTAs — checkout routes are unchanged.
 */
export function ProgramDetailCta({ program }: { program: HubProgram }) {
  const status = programStatus(program);
  const remaining = program.hasLiveCounts ? Math.max(0, program.seats - program.taken) : null;

  if (status === "upcoming" && remaining !== 0) {
    const label = program.price <= 0 ? "Register free" : "Register Now";
    return program.kind === "course" ? (
      <CourseEnrollmentCta slug={program.slug} registerLabel={label} />
    ) : (
      <EventEnrollmentCta slug={program.slug} registerLabel={label} />
    );
  }

  if (status === "upcoming" && remaining === 0) {
    return (
      <ClosedNote
        title="This cohort is full"
        body="Join the waitlist to be notified if a seat opens or when the next intake is announced."
        href={waitlistMailto(program.title)}
        action="Join Waitlist"
      />
    );
  }

  if (status === "registration_closed") {
    return (
      <ClosedNote
        title="Registration for this cohort has closed"
        body="Join the waitlist to be notified for the next intake."
        href={waitlistMailto(program.title)}
        action="Join Waitlist"
      />
    );
  }

  if (status === "in_progress") {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        {programSeatMessage(program)}. Registration for this intake is not open.{" "}
        <JumpLink href="/#upcoming" className="font-semibold text-neon-cyan hover:underline">
          See upcoming programs
        </JumpLink>
        .
      </p>
    );
  }

  return (
    <ClosedNote
      title="This program has ended"
      body="Get notified if Cloud Vaathi runs this program again."
      href={notifyReturnMailto(program.title)}
      action="Notify me when this returns"
    />
  );
}

function ClosedNote({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      <a
        href={href}
        className="inline-flex w-full items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-semibold"
      >
        {action}
      </a>
    </div>
  );
}
