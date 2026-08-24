import { GatedPrice } from "@/components/gated-price";
import { ProgramStatusBadge } from "@/components/program-status-badge";
import { SampleSessionButton } from "@/components/sample-session";
import { FOUNDER_PHOTO_PATH } from "@/lib/site-config";
import {
  formatProgramDateShort,
  isFounderMentor,
  notifyReturnMailto,
  programSeatMessage,
  programStatus,
  waitlistMailto,
  type HubProgram,
} from "@/lib/program-lifecycle";

const primaryBtn =
  "inline-flex items-center justify-center rounded-md bg-gradient-neon px-4 py-2 text-xs font-semibold text-black";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-md border border-border/60 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60";

export function ProgramCard({ program }: { program: HubProgram }) {
  const status = programStatus(program);
  const founder = isFounderMentor(program.mentorName);

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl glass p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
          {program.category}
        </span>
        <ProgramStatusBadge status={status} />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold leading-snug">{program.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{program.summary}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {program.format} · Starts {formatProgramDateShort(program.startDate)}
        {program.durationLabel ? ` · ${program.durationLabel}` : ""}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {founder ? (
          <img src={FOUNDER_PHOTO_PATH} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70 text-[10px] font-semibold">
            {program.mentorName.slice(0, 1)}
          </span>
        )}
        <p className="text-xs text-muted-foreground">Led by {program.mentorName}</p>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{programSeatMessage(program)}</p>
      <div className="mt-4 border-t border-border/50 pt-4">
        <GatedPrice amount={program.price} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <CardActions program={program} />
        <SampleSessionButton variant="link" className="self-start" />
      </div>
    </article>
  );
}

function CardActions({ program }: { program: HubProgram }) {
  const status = programStatus(program);
  const remaining = program.hasLiveCounts ? Math.max(0, program.seats - program.taken) : null;
  const full = remaining === 0;

  if (status === "upcoming" && !full) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <a href={program.href} className={secondaryBtn}>
          View details
        </a>
        <a href={program.registerHref} className={primaryBtn}>
          Register Now
        </a>
      </div>
    );
  }

  if ((status === "upcoming" && full) || status === "registration_closed") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <a href={program.href} className={secondaryBtn}>
          View details
        </a>
        <a href={waitlistMailto(program.title)} className={primaryBtn}>
          Join Waitlist
        </a>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <a href={program.href} className={primaryBtn}>
        Learn More
      </a>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={program.href} className={secondaryBtn}>
        View details
      </a>
      <a href={notifyReturnMailto(program.title)} className={secondaryBtn}>
        Notify me
      </a>
    </div>
  );
}
