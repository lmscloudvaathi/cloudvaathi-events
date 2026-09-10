import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SAMPLE_SESSION,
  SAMPLE_SESSIONS,
  type SampleSessionTrack,
} from "@/lib/site-config";
import { type ProgramCategory } from "@/lib/program-lifecycle";
import { eventsHref, useSiteMode } from "@/lib/site-mode";
import { cn } from "@/lib/utils";
import { JumpLink } from "@/components/jump-link";

export function sampleSessionTrackForCategory(
  category?: ProgramCategory | null,
): SampleSessionTrack {
  return category === "AI & GenAI" ? "ai" : "cloud";
}

const SESSION_OUTLINE: Record<SampleSessionTrack, string[]> = {
  cloud: [
    "Walkthrough of an Azure Virtual Network setup and how traffic flows between subnets.",
    "Demo of Network Security Group (NSG) rules used to allow or block ports for real workloads.",
    "Practical takeaways you can reuse in certification prep and day-to-day cloud architecture.",
  ],
  ai: [
    "Introduction to Retrieval-Augmented Generation (RAG) and why grounding LLMs in your data matters.",
    "Demo of a RAG flow: retrieve relevant context, then generate an answer with that context.",
    "How Cloud Vaathi applies the same pattern in AI skills bootcamps and live labs.",
  ],
};

type SampleSessionButtonProps = {
  className?: string;
  variant?: "button" | "card" | "link";
  /** Prefer passing the program category so Cloud vs AI demos are selected automatically. */
  category?: ProgramCategory;
  track?: SampleSessionTrack;
};

export function SampleSessionButton({
  className,
  variant = "button",
  category,
  track,
}: SampleSessionButtonProps) {
  const siteMode = useSiteMode();
  const resolvedTrack = track ?? sampleSessionTrackForCategory(category);
  const session = SAMPLE_SESSIONS[resolvedTrack] ?? SAMPLE_SESSION;
  const embedSrc = `https://www.youtube-nocookie.com/embed/${session.youtubeId}?rel=0&modestbranding=1&cc_load_policy=1`;
  const thumbSrc = `https://i.ytimg.com/vi/${session.youtubeId}/hqdefault.jpg`;
  const outline = SESSION_OUTLINE[resolvedTrack];
  const ctaLabel = session.ctaLabel;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "card" ? (
          <button
            type="button"
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl border border-border/60 text-left glass",
              className,
            )}
          >
            <img
              src={thumbSrc}
              alt={session.thumbnailAlt}
              width={480}
              height={360}
              className="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-neon text-primary-foreground glow-cyan">
                <Play className="h-6 w-6 fill-current" />
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-background/80 px-4 py-3 text-sm font-semibold">
              {ctaLabel}
            </span>
          </button>
        ) : variant === "link" ? (
          <button
            type="button"
            className={cn("text-xs font-semibold text-neon-cyan hover:underline", className)}
          >
            {ctaLabel}
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background/40 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60",
              className,
            )}
          >
            <Play className="h-4 w-4 fill-current" />
            {ctaLabel}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{session.title}</DialogTitle>
          <DialogDescription>
            Captions can be turned on in the player. Audio does not start until you press play.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video overflow-hidden rounded-lg border border-border/60 bg-black">
          <iframe
            title={session.title}
            src={embedSrc}
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <details className="rounded-lg border border-border/50 bg-surface/40 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">Session outline and transcript notes</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {outline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Enable closed captions in YouTube for the spoken transcript. A full timed transcript is not hosted on this
            page.
          </p>
        </details>
        <JumpLink
          href={eventsHref(siteMode, "/#upcoming")}
          className="inline-flex items-center justify-center rounded-full bg-gradient-neon px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Explore Upcoming Programs
        </JumpLink>
      </DialogContent>
    </Dialog>
  );
}
