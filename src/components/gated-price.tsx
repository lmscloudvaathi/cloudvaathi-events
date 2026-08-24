import { Link, useLocation } from "@tanstack/react-router";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatINR } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type GatedPriceProps = {
  amount: number;
  size?: "card" | "hero";
  signedInHint?: string;
  className?: string;
};

export function GatedPrice({ amount, size = "card", signedInHint, className }: GatedPriceProps) {
  const { user, loading } = useSessionUser();
  const location = useLocation();
  const redirect = `${location.pathname}${location.searchStr ?? ""}`;

  if (loading) {
    return (
      <div className={cn(size === "hero" ? "space-y-2" : "", className)} aria-hidden>
        <div className={cn("animate-pulse rounded-md bg-muted/40", size === "hero" ? "h-10 w-36" : "h-8 w-28")} />
        {size === "hero" ? <div className="h-3 w-32 animate-pulse rounded bg-muted/30" /> : null}
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn(size === "hero" ? "space-y-1" : "max-w-[9.5rem] text-right", className)}>
        <Link
          to="/login"
          search={{ redirect }}
          className={cn(
            "font-display font-semibold text-neon-cyan hover:underline",
            size === "hero" ? "text-xl leading-snug sm:text-2xl" : "text-sm leading-snug",
          )}
        >
          Sign in to view fee
        </Link>
        {size === "hero" ? (
          <p className="text-xs text-muted-foreground">The fee is shown after you sign in.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={cn("font-display font-bold text-gradient-neon", size === "hero" ? "text-4xl" : "text-2xl")}>
        {formatINR(amount)}
      </div>
      {signedInHint ? <p className="mt-1 text-xs text-muted-foreground">{signedInHint}</p> : null}
    </div>
  );
}
