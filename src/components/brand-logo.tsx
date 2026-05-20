import { Link } from "@tanstack/react-router";
import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  linked?: boolean;
  /** When set, logo links here instead of in-app `/` (e.g. marketing home from events subdomain). */
  homeHref?: string;
  size?: "sm" | "md";
  className?: string;
  showTagline?: boolean;
};

const sizes = {
  sm: { img: "h-8 w-8", title: "text-sm", tagline: "text-[9px]" },
  md: { img: "h-10 w-10", title: "text-base", tagline: "text-[10px]" },
} as const;

export function BrandLogo({ linked = false, homeHref, size = "md", className, showTagline = true }: BrandLogoProps) {
  const s = sizes[size];

  const content = (
    <>
      <img
        src={BRAND_LOGO_PATH}
        alt={`${BRAND_NAME} logo`}
        className={cn(s.img, "shrink-0 rounded-lg object-contain")}
        width={40}
        height={40}
      />
      <div className="flex flex-col leading-none">
        <span className={cn("font-display font-bold tracking-tight", s.title)}>{BRAND_NAME}</span>
        {showTagline ? (
          <span className={cn("font-mono uppercase tracking-[0.18em] text-muted-foreground", s.tagline)}>
            {BRAND_TAGLINE}
          </span>
        ) : null}
      </div>
    </>
  );

  if (linked && homeHref) {
    return (
      <a href={homeHref} className={cn("flex items-center gap-2.5 group", className)}>
        {content}
      </a>
    );
  }

  if (linked) {
    return (
      <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-2.5", className)}>{content}</div>;
}
