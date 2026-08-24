export type ProgramLifecycle = "Upcoming" | "Registration Closed" | "In Progress" | "Completed";

function asDateString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value);
}

function parseDateOnly(value: unknown): Date | null {
  const raw = asDateString(value).trim();
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function parseDurationMs(duration: unknown): number {
  const text = typeof duration === "string" ? duration : String(duration ?? "");
  const week = text.match(/(\d+)\s*weeks?/i);
  if (week) return Number(week[1]) * 7 * 24 * 60 * 60 * 1000;
  const day = text.match(/(\d+)\s*days?/i);
  if (day) return Number(day[1]) * 24 * 60 * 60 * 1000;
  const hour = text.match(/(\d+)\s*hours?/i);
  if (hour) return Number(hour[1]) * 60 * 60 * 1000;
  return 6 * 7 * 24 * 60 * 60 * 1000;
}

function lifecycleFromWindow(start: Date | null, end: Date | null, remaining: number): ProgramLifecycle {
  if (!start) return "Upcoming";
  const today = startOfToday();
  if (end && today > end) return "Completed";
  if (today >= start && (!end || today <= end)) return "In Progress";
  if (today < start && remaining <= 0) return "Registration Closed";
  return "Upcoming";
}

export function courseLifecycle(input: {
  startDate: unknown;
  duration: unknown;
  seats: number;
  enrolled: number;
}): ProgramLifecycle {
  const start = parseDateOnly(input.startDate);
  const end = start ? new Date(start.getTime() + parseDurationMs(input.duration) - 1) : null;
  return lifecycleFromWindow(start, end, input.seats - input.enrolled);
}

export function eventLifecycle(input: { date: unknown; seats: number; registered: number }): ProgramLifecycle {
  const start = parseDateOnly(input.date);
  return lifecycleFromWindow(start, start, input.seats - input.registered);
}

/** Date still in the future — includes full cohorts that have not started. */
export function isOpenForHomepage(status: ProgramLifecycle): boolean {
  return status === "Upcoming";
}

export function isCompletedLifecycle(status: ProgramLifecycle): boolean {
  return status === "Completed";
}

export function formatProgramDate(value: unknown): string {
  const d = parseDateOnly(value);
  if (!d) return "TBD";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function programDateSortKey(value: unknown): string {
  return asDateString(value);
}
