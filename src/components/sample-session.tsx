"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BRAND_LOGO_PATH,
  BRAND_NAME,
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

function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src={BRAND_LOGO_PATH} alt="" className="h-6 w-6 rounded-sm object-contain" />
      <span className="font-display text-sm font-semibold tracking-wide text-foreground">{BRAND_NAME}</span>
    </span>
  );
}

/** Themed poster / chrome so the visible UI is Cloud Vaathi, not the host player. */
function BrandedPoster({
  thumbSrc,
  title,
  alt,
  onPlay,
  compact,
}: {
  thumbSrc: string;
  title: string;
  alt: string;
  onPlay?: () => void;
  compact?: boolean;
}) {
  const inner = (
    <>
      <img
        src={thumbSrc}
        alt={alt}
        width={480}
        height={360}
        className="aspect-video h-full w-full object-cover"
      />
      {/* Theme wash — covers host watermarks on the still */}
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(160deg,oklch(0.13_0.04_270_/_0.88)_0%,oklch(0.17_0.05_280_/_0.55)_42%,oklch(0.2_0.08_300_/_0.72)_100%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(0.4_0.06_280_/_0.2)_1px,transparent_1px),linear-gradient(90deg,oklch(0.4_0.06_280_/_0.2)_1px,transparent_1px)] [background-size:36px_36px]"
      />
      <span className="absolute left-3 top-3 z-10 rounded-full border border-border/50 bg-background/70 px-2.5 py-1 backdrop-blur-md">
        <BrandMark />
      </span>
      <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-neon text-primary-foreground glow-cyan transition-transform group-hover:scale-105">
          <Play className="h-6 w-6 fill-current" />
        </span>
        {!compact ? (
          <span className="max-w-sm text-center text-sm font-semibold text-foreground drop-shadow">{title}</span>
        ) : null}
      </span>
      <span className="absolute inset-x-0 bottom-0 z-10 bg-background/85 px-4 py-3 text-sm font-semibold backdrop-blur-sm">
        Watch sample
      </span>
    </>
  );

  if (onPlay) {
    return (
      <button
        type="button"
        onClick={onPlay}
        className="group relative block aspect-video w-full overflow-hidden text-left"
      >
        {inner}
      </button>
    );
  }

  return <span className="group relative block aspect-video w-full overflow-hidden">{inner}</span>;
}

function BrandedVideoPlayer({
  youtubeId,
  title,
  thumbSrc,
  alt,
}: {
  youtubeId: string;
  title: string;
  thumbSrc: string;
  alt: string;
}) {
  const [playing, setPlaying] = useState(false);
  const embedSrc = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&controls=1&fs=0&autoplay=1`;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background glow-cyan">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-3">
        <BrandMark />
        <span className="truncate text-xs text-muted-foreground">{title}</span>
      </div>

      {!playing ? (
        <BrandedPoster thumbSrc={thumbSrc} title={title} alt={alt} onPlay={() => setPlaying(true)} />
      ) : (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            title={title}
            src={embedSrc}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {/* Cover host logo / name (usually bottom-left) and residual corners */}
          <div
            aria-hidden
            className="pointer-events-auto absolute bottom-0 left-0 z-20 flex h-12 w-40 items-center gap-2 bg-background px-3"
          >
            <img src={BRAND_LOGO_PATH} alt="" className="h-5 w-5 rounded-sm object-contain" />
            <span className="font-display text-xs font-semibold text-foreground">{BRAND_NAME}</span>
          </div>
          <div
            aria-hidden
            className="pointer-events-auto absolute bottom-0 left-40 z-20 h-12 w-16 bg-gradient-to-r from-background to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-auto absolute bottom-0 right-0 z-20 flex h-12 w-36 items-center justify-end bg-background px-3"
          >
            <span className="text-xs font-medium text-neon-cyan">Sample</span>
          </div>
          <div
            aria-hidden
            className="pointer-events-auto absolute bottom-0 right-36 z-20 h-12 w-16 bg-gradient-to-l from-background to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-auto absolute right-0 top-0 z-20 h-10 w-28 bg-gradient-to-l from-background via-background/90 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-auto absolute left-0 top-0 z-20 h-10 w-28 bg-gradient-to-r from-background via-background/90 to-transparent"
          />
        </div>
      )}

      <div className="flex h-10 items-center justify-between gap-3 border-t border-border/40 bg-background/95 px-3">
        <span className="text-xs font-medium text-neon-cyan">Sample session</span>
        <BrandMark className="opacity-90" />
      </div>
      <div className="h-0.5 bg-gradient-neon" />
    </div>
  );
}

export function SampleSessionButton({
  className,
  variant = "button",
  category,
  track,
}: SampleSessionButtonProps) {
  const siteMode = useSiteMode();
  const resolvedTrack = track ?? sampleSessionTrackForCategory(category);
  const session = SAMPLE_SESSIONS[resolvedTrack] ?? SAMPLE_SESSION;
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
            <BrandedPoster
              thumbSrc={thumbSrc}
              title={session.title}
              alt={session.thumbnailAlt}
              compact
            />
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-background/95 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrandMark />
            <span className="text-muted-foreground">·</span>
            <span>{session.title}</span>
          </DialogTitle>
        </DialogHeader>
        <BrandedVideoPlayer
          youtubeId={session.youtubeId}
          title={session.title}
          thumbSrc={thumbSrc}
          alt={session.thumbnailAlt}
        />
        <details className="rounded-lg border border-border/50 bg-surface/40 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold">Session outline</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {outline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
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
