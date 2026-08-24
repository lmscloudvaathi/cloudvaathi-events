import { Users } from "lucide-react";
import { getCohortAvailability, type CohortAvailabilityInput } from "@/lib/cohort-availability";
import { cn } from "@/lib/utils";

type CohortAvailabilityLabelProps = CohortAvailabilityInput & {
  className?: string;
  iconClassName?: string;
};

export function CohortAvailabilityLabel({
  seats,
  taken,
  startDate,
  className,
  iconClassName,
}: CohortAvailabilityLabelProps) {
  const { message } = getCohortAvailability({ seats, taken, startDate });
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Users className={cn("h-3.5 w-3.5 shrink-0", iconClassName)} />
      {message}
    </span>
  );
}
