import { useEffect, useState } from "react";
import {
  FOUNDER_CREDIBILITY_TAG,
  FOUNDER_GALLERY,
  FOUNDER_NAME,
  FOUNDER_PHOTO_PATH,
  FOUNDER_ROLE,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

const CAROUSEL_MS = 4500;

type FounderPortraitProps = {
  className?: string;
  /** `hero` = auto-rotating gallery on the home page; `page` = static headshot. */
  size?: "hero" | "page";
  priority?: boolean;
};

export function FounderPortrait({ className, size = "hero", priority = false }: FounderPortraitProps) {
  if (size === "page") {
    return (
      <figure className={cn("mx-auto w-full max-w-[18rem]", className)}>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/50 shadow-[0_24px_60px_-28px_oklch(0.05_0.02_270_/_0.85)]">
          <img
            src={FOUNDER_PHOTO_PATH}
            alt={`${FOUNDER_NAME}, ${FOUNDER_ROLE}`}
            width={560}
            height={560}
            className="aspect-square w-full object-cover object-top"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        </div>
        <figcaption className="mt-4 text-center">
          <div className="font-display text-lg font-semibold tracking-tight">{FOUNDER_NAME}</div>
          <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{FOUNDER_ROLE}</div>
          <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neon-cyan">
            {FOUNDER_CREDIBILITY_TAG}
          </div>
        </figcaption>
      </figure>
    );
  }

  return <FounderCarousel className={className} priority={priority} />;
}

function FounderCarousel({ className, priority }: { className?: string; priority?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const len = FOUNDER_GALLERY.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion || len < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % len), CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion, len]);

  return (
    <figure
      className={cn("mx-auto w-full max-w-[22rem] sm:max-w-[26rem]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Meet our Founder"
    >
      <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-neon-cyan">
        Meet our Founder
      </p>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/50 shadow-[0_24px_60px_-28px_oklch(0.05_0.02_270_/_0.85)]">
        <div className="relative aspect-[4/5] w-full">
          {FOUNDER_GALLERY.map((photo, i) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={`${FOUNDER_NAME} speaking at a professional event`}
              width={800}
              height={1000}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
              style={{ objectPosition: photo.position }}
              loading={priority && i === 0 ? "eager" : "lazy"}
              fetchPriority={priority && i === 0 ? "high" : "auto"}
              decoding="async"
              aria-hidden={i !== index}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
          role="tablist"
          aria-label="Founder photos"
        >
          {FOUNDER_GALLERY.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1} of ${len}`}
              className={cn(
                "pointer-events-auto h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-gradient-neon" : "w-1.5 bg-white/40 hover:bg-white/70",
              )}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-center">
        <div className="font-display text-xl font-semibold tracking-tight">{FOUNDER_NAME}</div>
        <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{FOUNDER_ROLE}</div>
        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neon-cyan">
          {FOUNDER_CREDIBILITY_TAG}
        </div>
      </figcaption>
      <p className="sr-only" aria-live="polite">
        Showing founder photo {index + 1} of {len}.
      </p>
    </figure>
  );
}
