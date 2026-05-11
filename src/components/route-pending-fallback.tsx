import { Spinner } from "@/components/spinner";

type Props = {
  /** Shorter block for nested layouts (e.g. under /courses child). */
  compact?: boolean;
};

export function RoutePendingFallback({ compact }: Props) {
  return (
    <div
      className={
        compact
          ? "flex min-h-[28vh] flex-col items-center justify-center gap-3 px-4 py-12"
          : "flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-20"
      }
    >
      <Spinner className="text-neon-cyan scale-125" label="Loading content" />
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Loading content…</p>
    </div>
  );
}
