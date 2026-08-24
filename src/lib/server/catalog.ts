import { dbQuery } from "./db";

/**
 * mysql2 / TiDB may return JSON columns as objects, as JSON strings, or (if mis-stored) as a plain string.
 */
function parseDbJson<T>(value: unknown): T {
  if (value == null) {
    throw new Error("Missing JSON column value");
  }
  if (typeof value !== "string") {
    return value as T;
  }
  const s = value.trim();
  if (!s) {
    throw new Error("Empty JSON column value");
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error(`Invalid JSON in database column: ${s.slice(0, 120)}`);
  }
}

/** For string[] JSON columns: tolerate a single plain string value. */
function parseDbStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (typeof value !== "string") {
    return [String(value)];
  }
  const s = value.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return parsed as string[];
    if (typeof parsed === "string") return [parsed];
    return [String(parsed)];
  } catch {
    return [s];
  }
}

/** YYYY-MM-DD from a MySQL DATE / Date / ISO string. Does not invent values. */
function toIsoDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const m = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export type CourseRow = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  startDate: string;
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  programEndDate: string | null;
  price: number;
  seats: number;
  enrolled: number;
  tags: string[];
  instructor: string;
  modules: { title: string; lessons: string[] }[];
};

export type EventRow = {
  slug: string;
  title: string;
  type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
  date: string;
  time: string;
  venue: string;
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  programEndDate: string | null;
  price: number;
  seats: number;
  registered: number;
  description: string;
  speakers: string[];
};

export async function listCourses(): Promise<CourseRow[]> {
  const rows = await dbQuery<
    Array<
      Omit<CourseRow, "startDate" | "tags" | "modules"> & {
        start_date: string;
        tags_json: string;
        modules_json: string;
      }
    >
  >(
    `SELECT slug,title,tagline,description,level,duration,start_date,registration_open_date,registration_close_date,program_end_date,price,seats,enrolled,tags_json,instructor,modules_json
     FROM courses WHERE active=1 ORDER BY start_date ASC`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    description: r.description,
    level: r.level,
    duration: r.duration,
    startDate: toIsoDate(r.start_date) ?? "",
    registrationOpenDate: toIsoDate(
      (r as { registration_open_date?: unknown }).registration_open_date,
    ),
    registrationCloseDate: toIsoDate(
      (r as { registration_close_date?: unknown }).registration_close_date,
    ),
    programEndDate: toIsoDate((r as { program_end_date?: unknown }).program_end_date),
    price: r.price,
    seats: r.seats,
    enrolled: r.enrolled,
    tags: parseDbStringArray(r.tags_json),
    instructor: r.instructor,
    modules: parseDbJson<CourseRow["modules"]>(r.modules_json),
  }));
}

export async function getCourseBySlug(slug: string) {
  const rows = await dbQuery<
    Array<
      Omit<CourseRow, "startDate" | "tags" | "modules"> & {
        start_date: string;
        tags_json: string;
        modules_json: string;
      }
    >
  >(
    `SELECT slug,title,tagline,description,level,duration,start_date,registration_open_date,registration_close_date,program_end_date,price,seats,enrolled,tags_json,instructor,modules_json
     FROM courses WHERE slug=? AND active=1 LIMIT 1`,
    [slug],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    description: r.description,
    level: r.level,
    duration: r.duration,
    startDate: toIsoDate(r.start_date) ?? "",
    registrationOpenDate: toIsoDate(
      (r as { registration_open_date?: unknown }).registration_open_date,
    ),
    registrationCloseDate: toIsoDate(
      (r as { registration_close_date?: unknown }).registration_close_date,
    ),
    programEndDate: toIsoDate((r as { program_end_date?: unknown }).program_end_date),
    price: r.price,
    seats: r.seats,
    enrolled: r.enrolled,
    tags: parseDbStringArray(r.tags_json),
    instructor: r.instructor,
    modules: parseDbJson<CourseRow["modules"]>(r.modules_json),
  } satisfies CourseRow;
}

export async function listEvents(): Promise<EventRow[]> {
  const rows = await dbQuery<
    Array<
      Omit<EventRow, "date" | "time" | "speakers"> & {
        event_date: string;
        event_time: string;
        speakers_json: string;
      }
    >
  >(
    `SELECT slug,title,type,event_date,event_time,venue,registration_open_date,registration_close_date,program_end_date,price,seats,registered,description,speakers_json
     FROM events WHERE active=1 ORDER BY event_date ASC`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    type: r.type,
    date: toIsoDate(r.event_date) ?? "",
    time: r.event_time,
    venue: r.venue,
    registrationOpenDate: toIsoDate(
      (r as { registration_open_date?: unknown }).registration_open_date,
    ),
    registrationCloseDate: toIsoDate(
      (r as { registration_close_date?: unknown }).registration_close_date,
    ),
    programEndDate: toIsoDate((r as { program_end_date?: unknown }).program_end_date),
    price: r.price,
    seats: r.seats,
    registered: r.registered,
    description: r.description,
    speakers: parseDbStringArray(r.speakers_json),
  }));
}

export async function getEventBySlug(slug: string) {
  const rows = await dbQuery<
    Array<
      Omit<EventRow, "date" | "time" | "speakers"> & {
        event_date: string;
        event_time: string;
        speakers_json: string;
      }
    >
  >(
    `SELECT slug,title,type,event_date,event_time,venue,registration_open_date,registration_close_date,program_end_date,price,seats,registered,description,speakers_json
     FROM events WHERE slug=? AND active=1 LIMIT 1`,
    [slug],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    slug: r.slug,
    title: r.title,
    type: r.type,
    date: toIsoDate(r.event_date) ?? "",
    time: r.event_time,
    venue: r.venue,
    registrationOpenDate: toIsoDate(
      (r as { registration_open_date?: unknown }).registration_open_date,
    ),
    registrationCloseDate: toIsoDate(
      (r as { registration_close_date?: unknown }).registration_close_date,
    ),
    programEndDate: toIsoDate((r as { program_end_date?: unknown }).program_end_date),
    price: r.price,
    seats: r.seats,
    registered: r.registered,
    description: r.description,
    speakers: parseDbStringArray(r.speakers_json),
  } satisfies EventRow;
}

export async function getPurchasableItem(itemType: "course" | "event", slug: string) {
  if (itemType === "course") {
    const item = await getCourseBySlug(slug);
    return item ? { title: item.title, amount: item.price, itemType, slug } : null;
  }
  const events = await listEvents();
  const item = events.find((e) => e.slug === slug);
  return item ? { title: item.title, amount: item.price, itemType, slug } : null;
}

export type ProgramNotifyDetails = {
  title: string;
  duration: string;
  startDate: string;
  mode: "Online" | "Offline" | "Hybrid";
  batchTiming: string;
};

function inferDeliveryMode(text?: string | null): "Online" | "Offline" | "Hybrid" {
  const v = (text ?? "").toLowerCase();
  if (/\bhybrid\b/.test(v)) return "Hybrid";
  if (/online|zoom|virtual|remote/.test(v)) return "Online";
  if (!v.trim()) return "Online";
  return "Offline";
}

function formatNotifyDate(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00+05:30` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** Course/program fields used in the admin registration alert email. */
export async function getProgramNotifyDetails(
  itemType: "course" | "event",
  slug: string,
): Promise<ProgramNotifyDetails | null> {
  if (itemType === "course") {
    const c = await getCourseBySlug(slug);
    if (!c) return null;
    return {
      title: c.title,
      duration: c.duration || "See dashboard",
      startDate: formatNotifyDate(c.startDate),
      mode: inferDeliveryMode(c.duration),
      batchTiming: c.duration || "See dashboard",
    };
  }
  const e = await getEventBySlug(slug);
  if (!e) return null;
  return {
    title: e.title,
    duration: e.time || "See dashboard",
    startDate: formatNotifyDate(e.date),
    mode: inferDeliveryMode(e.venue),
    batchTiming: [e.time, e.venue].filter(Boolean).join(" · ") || "See dashboard",
  };
}
