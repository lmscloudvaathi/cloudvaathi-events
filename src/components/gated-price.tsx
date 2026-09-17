import { formatINR } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type GatedPriceProps = {
  amount: number;
  size?: "card" | "hero";
  signedInHint?: string;
  className?: string;
};

export function GatedPrice({ amount, size = "card", signedInHint, className }: GatedPriceProps) {
  return (
    <div className={className}>
      <div className={cn("font-display font-bold text-gradient-neon", size === "hero" ? "text-4xl" : "text-2xl")}>
        {formatINR(amount)}
      </div>
      {signedInHint ? <p className="mt-1 text-xs text-muted-foreground">{signedInHint}</p> : null}
    </div>
  );
}
