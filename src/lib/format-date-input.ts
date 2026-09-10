/** Normalize DB DATE / Date / ISO string for `<input type="date">` (YYYY-MM-DD). */
export function formatDateForInput(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (!s) return "";
  const dateOnly = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) return dateOnly[1];
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift a YYYY-MM-DD calendar date by `days` (local arithmetic, date-only). */
export function shiftIsoDate(iso: string, days: number): string {
  const base = formatDateForInput(iso);
  if (!base) return "";
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Default registration window for events (open 21 days before; close/end on event day). */
export function defaultEventLifecycleDates(eventDate: string): {
  registrationOpenDate: string;
  registrationCloseDate: string;
  programEndDate: string;
} {
  const date = formatDateForInput(eventDate);
  return {
    registrationOpenDate: shiftIsoDate(date, -21),
    registrationCloseDate: date,
    programEndDate: date,
  };
}

/** Default registration window for courses (open 30 days before; close on start day). */
export function defaultCourseLifecycleDates(startDate: string): {
  registrationOpenDate: string;
  registrationCloseDate: string;
  programEndDate: string;
} {
  const date = formatDateForInput(startDate);
  return {
    registrationOpenDate: shiftIsoDate(date, -30),
    registrationCloseDate: date,
    programEndDate: date,
  };
}
