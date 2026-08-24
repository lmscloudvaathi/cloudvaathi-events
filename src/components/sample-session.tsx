import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SAMPLE_SESSION } from "@/lib/site-config";
import { eventsHref, useSiteMode } from "@/lib/site-mode";
import { cn } from "@/lib/utils";
import { JumpLink } from "@/components/jump-link";

const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${SAMPLE_SESSION.youtubeId}?rel=0&modestbranding=1&cc_load_policy=1`;
const THUMB_SRC = `https://i.ytimg.com/vi/${SAMPLE_SESSION.youtubeId}/hqdefault.jpg`;

const SESSION_OUTLINE = [
  "Sivva Kannan introduces how Cloud Vaathi approaches high-stakes certifications — thinking like a manager, not only like a candidate memorising dumps.",
  "He walks through how exam domains map to real security and cloud decisions, so learners can reason under pressure instead of relying on shortcuts.",
  "The session closes by pointing professionals toward structured mentoring, labs, and upcoming cohorts where that same method is practised live.",
];

type SampleSessionButtonProps = {
  className?: string;
  variant?: "button" | "card" | "link";
};

export function SampleSessionButton({ className, variant = "button" }: SampleSessionButtonProps) {
  const siteMode = useSiteMode();
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
              src={THUMB_SRC}
              alt={SAMPLE_SESSION.thumbnailAlt}
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
              Watch Sample Session
            </span>
          </button>
        ) : variant === "link" ? (
          <button
            type="button"
            className={cn("text-xs font-semibold text-neon-cyan hover:underline", className)}
          >
            Watch Sample Session
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
            Watch Sample Session
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{SAMPLE_SESSION.title}</DialogTitle>
          <DialogDescription>
            Captions can be turned on in the player. Audio does not start until you press play.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video overflow-hidden rounded-lg border border-border/60 bg-black">
          <iframe
            title={SAMPLE_SESSION.title}
            src={EMBED_SRC}
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <details className="rounded-lg border border-border/50 bg-surface/40 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">Session outline and transcript notes</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {SESSION_OUTLINE.map((line) => (
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
