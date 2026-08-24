/** Public copy for cohort/event capacity. Never show filled/total counters like "1/8". */

export type CohortAvailabilityKind = "in_progress" | "full" | "remaining" | "closes" | "limited";

export type CohortAvailability = {
  kind: CohortAvailabilityKind;
  message: string;
};

export type CohortAvailabilityInput = {
  seats: number;
  /**
   * Filled seats from live registration (courses.enrolled / events.registered).
   * Exact remaining-seat copy is shown only when this is a finite, non-negative number.
   */
  taken?: number | null;
  /** Course start date or event date (YYYY-MM-DD or ISO). */
  startDate?: string | Date | null;
};

const FEW_SEATS_MAX = 5;
const CLOSES_SOON_DAYS = 14;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateOnly(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return startOfLocalDay(value);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return startOfLocalDay(d);
}

function formatCloseDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

function hasLiveTaken(taken: number | null | undefined): taken is number {
  return taken != null && Number.isFinite(taken) && taken >= 0;
}

export function getCohortAvailability(input: CohortAvailabilityInput): CohortAvailability {
  const seats = Number.isFinite(input.seats) && input.seats > 0 ? Math.floor(input.seats) : 0;
  const start = input.startDate ? parseDateOnly(String(input.startDate)) : null;
  const today = startOfLocalDay(new Date());

  if (start && start.getTime() < today.getTime()) {
    return { kind: "in_progress", message: "Cohort in progress" };
  }

  const remaining = hasLiveTaken(input.taken) && seats > 0 ? Math.max(0, seats - Math.floor(input.taken)) : null;

  if (remaining === 0) {
    return { kind: "full", message: "Cohort full — Join waitlist" };
  }

  if (remaining != null && remaining > 0 && remaining <= FEW_SEATS_MAX && remaining < seats) {
    return {
      kind: "remaining",
      message: remaining === 1 ? "Only 1 seat remaining" : `Only ${remaining} seats remaining`,
    };
  }

  if (start && start.getTime() >= today.getTime()) {
    const daysUntil = Math.round((start.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil <= CLOSES_SOON_DAYS) {
      return { kind: "closes", message: `Registration closes ${formatCloseDate(start)}` };
    }
  }

  if (seats > 0) {
    return {
      kind: "limited",
      message: seats === 1 ? "Limited to 1 learner" : `Limited to ${seats} learners`,
    };
  }

  return { kind: "limited", message: "Registration open" };
}
