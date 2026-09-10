import { defaultCourseLifecycleDates, defaultEventLifecycleDates, formatDateForInput } from "@/lib/format-date-input";
import { dbQuery } from "./db";

function parseDbStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== "string") return [String(value)];
  const s = value.trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === "string") return [parsed];
    return [String(parsed)];
  } catch {
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
}

function parseDbModules(
  value: unknown,
): Array<{ title: string; lessons: string[] }> {
  if (value == null) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed as Array<{ title: string; lessons: string[] }>;
      return [];
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? (value as Array<{ title: string; lessons: string[] }>) : [];
}

export async function getAdminStats() {
  const [revenue] = await dbQuery<{ total: number }[]>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status='paid'`,
  );
  const [enrollCount] = await dbQuery<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM enrollments WHERE item_type='course'`,
  );
  const [eventRegs] = await dbQuery<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM enrollments WHERE item_type='event'`,
  );
  const [participants] = await dbQuery<{ total: number }[]>(`SELECT COUNT(*) as total FROM enrollments`);
  return {
    revenue: revenue?.total ?? 0,
    enrolledLearners: enrollCount?.total ?? 0,
    eventRegistrations: eventRegs?.total ?? 0,
    activeParticipants: participants?.total ?? 0,
  };
}

export async function listParticipants() {
  return dbQuery<
    Array<{
      id: number;
      name: string;
      email: string;
      phone: string | null;
      item_type: "course" | "event";
      item_slug: string;
      amount: number;
      payment_status: "Paid" | "Pending" | "Refunded";
      registered_at: string;
    }>
  >(
    `SELECT e.id, u.name, u.email, u.phone, e.item_type, e.item_slug, e.amount, e.payment_status, e.registered_at
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     ORDER BY e.registered_at DESC`,
  );
}

export async function adminListCourses() {
  return dbQuery<
    Array<{
      slug: string;
      title: string;
      level: string;
      start_date: string;
      seats: number;
      enrolled: number;
      price: number;
      instructor: string;
      active: number;
    }>
  >(
    `SELECT slug, title, level, start_date, seats, enrolled, price, instructor, active
     FROM courses ORDER BY active DESC, start_date ASC`,
  );
}

export async function adminListEvents() {
  return dbQuery<
    Array<{
      slug: string;
      title: string;
      type: string;
      event_date: string;
      venue: string;
      seats: number;
      registered: number;
      price: number;
      active: number;
    }>
  >(
    `SELECT slug, title, type, event_date, venue, seats, registered, price, active
     FROM events ORDER BY active DESC, event_date ASC`,
  );
}

export async function adminCreateCourse(input: {
  slug: string;
  title: string;
  price: number;
  seats: number;
  startDate: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}) {
  const starterModules = [
    { title: "Foundations", lessons: ["Concepts", "Setup", "Hands-on lab"] },
    { title: "Applied practice", lessons: ["Project walkthrough", "Debugging clinic"] },
  ];
  const lifecycle = defaultCourseLifecycleDates(input.startDate);
  await dbQuery(
    `INSERT INTO courses
     (slug, title, tagline, description, level, duration, start_date, price, seats, enrolled, tags_json, instructor, modules_json,
      registration_open_date, registration_close_date, program_end_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)`,
    [
      input.slug,
      input.title,
      `${input.title} - Learn by building with mentors`,
      `${input.title}. Includes practical labs, mentorship and project-based learning.`,
      input.level,
      "4 weeks",
      input.startDate,
      input.price,
      input.seats,
      JSON.stringify([input.level, "Cloud Vaathi"]),
      "Cloud Vaathi Team",
      JSON.stringify(starterModules),
      lifecycle.registrationOpenDate,
      lifecycle.registrationCloseDate,
      lifecycle.programEndDate,
    ],
  );
}

export async function adminGetCourseBySlug(slug: string) {
  const rows = await dbQuery<
    Array<{
      slug: string;
      title: string;
      tagline: string;
      description: string;
      level: "Beginner" | "Intermediate" | "Advanced";
      duration: string;
      start_date: string;
      price: number;
      seats: number;
      instructor: string;
      tags_json: unknown;
      modules_json: unknown;
      registration_open_date: string | null;
      registration_close_date: string | null;
      program_end_date: string | null;
      active: number;
    }>
  >(
    `SELECT slug,title,tagline,description,level,duration,start_date,price,seats,instructor,tags_json,modules_json,
            registration_open_date, registration_close_date, program_end_date, active
     FROM courses WHERE slug=? LIMIT 1`,
    [slug],
  );
  const c = rows[0];
  if (!c) return null;
  const startDate = formatDateForInput(c.start_date);
  const lifecycle = defaultCourseLifecycleDates(startDate);
  return {
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    description: c.description,
    level: c.level,
    duration: c.duration,
    startDate,
    price: c.price,
    seats: c.seats,
    instructor: c.instructor,
    tags: parseDbStringArray(c.tags_json),
    modules: parseDbModules(c.modules_json),
    registrationOpenDate:
      formatDateForInput(c.registration_open_date) || lifecycle.registrationOpenDate,
    registrationCloseDate:
      formatDateForInput(c.registration_close_date) || lifecycle.registrationCloseDate,
    programEndDate: formatDateForInput(c.program_end_date) || lifecycle.programEndDate,
    active: c.active,
  };
}

export async function adminUpdateCourse(input: {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  startDate: string;
  price: number;
  seats: number;
  instructor: string;
  tags: string[];
  modules: Array<{ title: string; lessons: string[] }>;
  registrationOpenDate: string;
  registrationCloseDate: string;
  programEndDate: string;
  active: boolean;
}) {
  const lifecycle = defaultCourseLifecycleDates(input.startDate);
  await dbQuery(
    `UPDATE courses
     SET title=?, tagline=?, description=?, level=?, duration=?, start_date=?, price=?, seats=?,
         instructor=?, tags_json=?, modules_json=?,
         registration_open_date=?, registration_close_date=?, program_end_date=?, active=?
     WHERE slug=?`,
    [
      input.title,
      input.tagline,
      input.description,
      input.level,
      input.duration,
      input.startDate,
      input.price,
      input.seats,
      input.instructor,
      JSON.stringify(input.tags),
      JSON.stringify(input.modules),
      formatDateForInput(input.registrationOpenDate) || lifecycle.registrationOpenDate,
      formatDateForInput(input.registrationCloseDate) || lifecycle.registrationCloseDate,
      formatDateForInput(input.programEndDate) || lifecycle.programEndDate,
      input.active ? 1 : 0,
      input.slug,
    ],
  );
}

export async function adminCreateEvent(input: {
  slug: string;
  title: string;
  date: string;
  type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
  venue: string;
  price: number;
  seats: number;
}) {
  const lifecycle = defaultEventLifecycleDates(input.date);
  await dbQuery(
    `INSERT INTO events
     (slug, title, type, event_date, event_time, venue, price, seats, registered, description, speakers_json,
      registration_open_date, registration_close_date, program_end_date, active)
     VALUES (?, ?, ?, ?, '10:00 - 13:00', ?, ?, ?, 0, ?, ?, ?, ?, ?, 1)`,
    [
      input.slug,
      input.title,
      input.type,
      input.date,
      input.venue,
      input.price,
      input.seats,
      `${input.title} with practical sessions and Q&A.`,
      JSON.stringify(["Cloud Vaathi Speaker"]),
      lifecycle.registrationOpenDate,
      lifecycle.registrationCloseDate,
      lifecycle.programEndDate,
    ],
  );
}

function cloneEventSlugBase(slug: string): string {
  return slug.replace(/-copy(?:-\d+)?$/i, "") || slug;
}

async function allocateClonedEventSlug(sourceSlug: string): Promise<string> {
  const base = cloneEventSlugBase(sourceSlug);
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? `${base}-copy` : `${base}-copy-${n}`;
    const rows = await dbQuery<Array<{ slug: string }>>(
      `SELECT slug FROM events WHERE slug=? LIMIT 1`,
      [candidate],
    );
    if (!rows[0]) return candidate;
  }
  throw new Error("Could not allocate a unique slug for the cloned event");
}

function cloneEventTitle(title: string): string {
  const trimmed = title.replace(/\s*\(Copy(?: \d+)?\)\s*$/i, "").trim() || title;
  return `${trimmed} (Copy)`;
}

/** Duplicate an event with a new slug. Registration count resets to 0. Starts as draft unless publish=true. */
export async function adminCloneEvent(input: {
  sourceSlug: string;
  publish?: boolean;
}): Promise<{ slug: string }> {
  const rows = await dbQuery<
    Array<{
      slug: string;
      title: string;
      type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
      event_date: string;
      event_time: string;
      venue: string;
      price: number;
      seats: number;
      description: string;
      speakers_json: unknown;
    }>
  >(
    `SELECT slug, title, type, event_date, event_time, venue, price, seats, description, speakers_json
     FROM events WHERE slug=? LIMIT 1`,
    [input.sourceSlug],
  );
  const source = rows[0];
  if (!source) throw new Error("Event not found");

  const newSlug = await allocateClonedEventSlug(source.slug);
  const speakersJson =
    typeof source.speakers_json === "string"
      ? source.speakers_json
      : JSON.stringify(parseDbStringArray(source.speakers_json));
  const publish = input.publish === true;
  const eventDate = formatDateForInput(source.event_date);
  const lifecycle = defaultEventLifecycleDates(eventDate);

  await dbQuery(
    `INSERT INTO events
     (slug, title, type, event_date, event_time, venue, price, seats, registered, description, speakers_json,
      registration_open_date, registration_close_date, program_end_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    [
      newSlug,
      cloneEventTitle(source.title),
      source.type,
      eventDate,
      source.event_time,
      source.venue,
      source.price,
      source.seats,
      source.description,
      speakersJson,
      lifecycle.registrationOpenDate,
      lifecycle.registrationCloseDate,
      lifecycle.programEndDate,
      publish ? 1 : 0,
    ],
  );

  return { slug: newSlug };
}

export async function adminGetEventBySlug(slug: string) {
  const rows = await dbQuery<
    Array<{
      slug: string;
      title: string;
      type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
      event_date: string;
      event_time: string;
      venue: string;
      price: number;
      seats: number;
      description: string;
      speakers_json: unknown;
      registration_open_date: string | null;
      registration_close_date: string | null;
      program_end_date: string | null;
      active: number;
    }>
  >(
    `SELECT slug,title,type,event_date,event_time,venue,price,seats,description,speakers_json,
            registration_open_date, registration_close_date, program_end_date, active
     FROM events WHERE slug=? LIMIT 1`,
    [slug],
  );
  const e = rows[0];
  if (!e) return null;
  const date = formatDateForInput(e.event_date);
  const lifecycle = defaultEventLifecycleDates(date);
  return {
    slug: e.slug,
    title: e.title,
    type: e.type,
    date,
    time: e.event_time,
    venue: e.venue,
    price: e.price,
    seats: e.seats,
    description: e.description,
    speakers: parseDbStringArray(e.speakers_json),
    registrationOpenDate:
      formatDateForInput(e.registration_open_date) || lifecycle.registrationOpenDate,
    registrationCloseDate:
      formatDateForInput(e.registration_close_date) || lifecycle.registrationCloseDate,
    programEndDate: formatDateForInput(e.program_end_date) || lifecycle.programEndDate,
    active: e.active,
  };
}

export async function adminUpdateEvent(input: {
  slug: string;
  title: string;
  type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
  date: string;
  time: string;
  venue: string;
  price: number;
  seats: number;
  description: string;
  speakers: string[];
  registrationOpenDate: string;
  registrationCloseDate: string;
  programEndDate: string;
  active: boolean;
}) {
  const lifecycle = defaultEventLifecycleDates(input.date);
  await dbQuery(
    `UPDATE events
     SET title=?, type=?, event_date=?, event_time=?, venue=?, price=?, seats=?, description=?, speakers_json=?,
         registration_open_date=?, registration_close_date=?, program_end_date=?, active=?
     WHERE slug=?`,
    [
      input.title,
      input.type,
      input.date,
      input.time,
      input.venue,
      input.price,
      input.seats,
      input.description,
      JSON.stringify(input.speakers),
      formatDateForInput(input.registrationOpenDate) || lifecycle.registrationOpenDate,
      formatDateForInput(input.registrationCloseDate) || lifecycle.registrationCloseDate,
      formatDateForInput(input.programEndDate) || lifecycle.programEndDate,
      input.active ? 1 : 0,
      input.slug,
    ],
  );
}

export async function adminDeactivateCourse(slug: string) {
  await dbQuery(`UPDATE courses SET active=0 WHERE slug=?`, [slug]);
}

export async function adminDeactivateEvent(slug: string) {
  await dbQuery(`UPDATE events SET active=0 WHERE slug=?`, [slug]);
}

export async function adminRestoreCourse(slug: string) {
  await dbQuery(`UPDATE courses SET active=1 WHERE slug=?`, [slug]);
}

export async function adminRestoreEvent(slug: string) {
  await dbQuery(`UPDATE events SET active=1 WHERE slug=?`, [slug]);
}

export async function adminHardDeleteCourse(slug: string) {
  await dbQuery(`DELETE FROM courses WHERE slug=?`, [slug]);
}

export async function adminHardDeleteEvent(slug: string) {
  await dbQuery(`DELETE FROM events WHERE slug=?`, [slug]);
}
