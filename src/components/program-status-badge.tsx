import { cn } from "@/lib/utils";
import { statusBadgeClass, statusLabel, type ProgramStatus } from "@/lib/program-lifecycle";

export function ProgramStatusBadge({ status, className }: { status: ProgramStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider",
        statusBadgeClass(status),
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
