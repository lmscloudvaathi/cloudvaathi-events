import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

/** Accessible inline spinner for buttons and overlays. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} role="status" aria-label={label ?? "Loading"}>
      <span
        className={cn(
          "inline-block h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90",
        )}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
