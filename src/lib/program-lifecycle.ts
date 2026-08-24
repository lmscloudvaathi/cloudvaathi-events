import { CONTACT_EMAIL, FOUNDER_NAME } from "@/lib/site-config";

export type CourseLike = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: string;
  duration: string;
  startDate: string;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  programEndDate?: string | null;
  price: number;
  seats: number;
  enrolled: number;
  tags: string[];
  instructor: string;
  modules: { title: string; lessons: string[] }[];
};

export type EventLike = {
  slug: string;
  title: string;
  type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup" | string;
  date: string;
  time: string;
  venue: string;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  programEndDate?: string | null;
  price: number;
  seats: number;
  registered: number;
  description: string;
  speakers: string[];
};

export const PROGRAM_CATEGORIES = [
  "Cloud & DevOps",
  "Cybersecurity",
  "AI & GenAI",
  "Automation & Testing",
  "Certification Prep",
] as const;

export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];

export type ProgramStatus = "upcoming" | "registration_closed" | "in_progress" | "completed";

export type ProgramKind = "course" | "event";

export type HubProgram = {
  kind: ProgramKind;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: ProgramCategory;
  categorySource: "mapped" | "fallback";
  format: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  durationLabel: string;
  seats: number;
  taken: number;
  hasLiveCounts: boolean;
  price: number;
  href: string;
  registerHref: string;
  modules: { title: string; lessons: string[] }[];
  extraMeta: string;
};

const FEW_SEATS_MAX = 5;

function todayIsoIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function coerceIsoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const m = String(value ?? "").trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function isoDate(value: unknown, fallback: unknown = ""): string {
  return coerceIsoDate(value) ?? coerceIsoDate(fallback) ?? "";
}

function inferEndDate(start: string, duration: string | undefined): string {
  const base = isoDate(start, start);
  if (!duration) return base;
  const weeks = duration.match(/(\d+)\s*week/i);
  if (weeks) {
    const d = parseIso(base);
    d.setDate(d.getDate() + Number(weeks[1]) * 7);
    return toIso(d);
  }
  const days = duration.match(/(\d+)\s*day/i);
  if (days) {
    const d = parseIso(base);
    d.setDate(d.getDate() + Math.max(0, Number(days[1]) - 1));
    return toIso(d);
  }
  return base;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatProgramDate(iso: string): string {
  const d = parseIso(isoDate(iso, iso));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function formatProgramDateShort(iso: string): string {
  const d = parseIso(isoDate(iso, iso));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function computeProgramStatus(input: {
  startDate: string;
  endDate: string;
  registrationCloseDate: string;
}): ProgramStatus {
  const today = todayIsoIST();
  const start = isoDate(input.startDate, input.startDate);
  const end = isoDate(input.endDate, start);
  const close = isoDate(input.registrationCloseDate, start);
  const last = end < start ? start : end;

  if (today > last) return "completed";
  if (today >= start && today <= last) return "in_progress";
  if (today >= close && today < start) return "registration_closed";
  return "upcoming";
}

/**
 * Infer category from the course/program **name** (title + slug), not from descriptions or tags.
 * Descriptions often mention IAM, testing, or AI in passing and would mis-label the offering.
 */
export function mapProgramCategory(haystack: string): { category: ProgramCategory; source: "mapped" | "fallback" } {
  const h = haystack.toLowerCase().replace(/[-_/]+/g, " ");

  if (/(cyber|\bsecurity\b|zero trust|\biam\b|\bsoc\b|threat|pentest|cissp|cism|ccsp|cisa|az 500|sc 200|sc 300)/.test(h)) {
    return { category: "Cybersecurity", source: "mapped" };
  }
  if (/(\bai\b|genai|gen ai|llm|machine learning|aaia|chatgpt|prompt engineer)/.test(h)) {
    return { category: "AI & GenAI", source: "mapped" };
  }
  if (/(playwright|selenium|cypress|qa automation|test automation|\btesting\b|\bqa\b)/.test(h)) {
    return { category: "Automation & Testing", source: "mapped" };
  }
  if (/(az 900|az 104|az 305|sc 900|togaf|exam prep|certification|certified|foundations \(az)/.test(h)) {
    return { category: "Certification Prep", source: "mapped" };
  }
  if (/(aws|azure|gcp|google cloud|kubernetes|\bk8s\b|devops|terraform|cloud|docker|serverless|platform|sre|architect|\biac\b)/.test(h)) {
    return { category: "Cloud & DevOps", source: "mapped" };
  }
  return { category: "Cloud & DevOps", source: "fallback" };
}

/** Category derived only from the public name of a course or program. */
export function categoryFromProgramName(title: string, _slug = ""): ProgramCategory {
  return mapProgramCategory(title).category;
}

function courseFormat(duration: string): string {
  if (/weekend/i.test(duration)) return "Weekend Cohort";
  return "Live Online";
}

function eventFormat(type: string, venue: string): string {
  if (/online|zoom|virtual|remote/i.test(venue)) return "Live Online";
  if (type === "Workshop") return "Live Workshop";
  if (type === "Meetup") return "In-person Meetup";
  if (type === "Hackathon") return "Hackathon";
  return "In person";
}

export function courseToHubProgram(c: CourseLike): HubProgram {
  const start = isoDate(c.startDate, c.startDate);
  const close = isoDate(c.registrationCloseDate, start);
  const open = isoDate(c.registrationOpenDate, start);
  const storedEnd = isoDate(c.programEndDate, start);
  const end = storedEnd !== start ? storedEnd : inferEndDate(start, c.duration);
  const { category, source } = mapProgramCategory(c.title);
  return {
    kind: "course",
    slug: c.slug,
    title: c.title,
    summary: c.tagline,
    description: c.description,
    category,
    categorySource: source,
    format: courseFormat(c.duration),
    mentorName: c.instructor,
    startDate: start,
    endDate: end,
    registrationOpenDate: open,
    registrationCloseDate: close,
    durationLabel: c.duration,
    seats: c.seats,
    taken: c.enrolled,
    hasLiveCounts: Number.isFinite(c.enrolled),
    price: c.price,
    href: `/courses/${encodeURIComponent(c.slug)}`,
    registerHref: `/register/${encodeURIComponent(c.slug)}`,
    modules: c.modules ?? [],
    extraMeta: c.level,
  };
}

export function eventToHubProgram(e: EventLike): HubProgram {
  const start = isoDate(e.date, e.date);
  const close = isoDate(e.registrationCloseDate, start);
  const open = isoDate(e.registrationOpenDate, start);
  const end = isoDate(e.programEndDate, start);
  const { category, source } = mapProgramCategory(e.title);
  return {
    kind: "event",
    slug: e.slug,
    title: e.title,
    summary: e.description,
    description: e.description,
    category,
    categorySource: source,
    format: eventFormat(e.type, e.venue),
    mentorName: e.speakers[0] ?? "Cloud Vaathi",
    startDate: start,
    endDate: end,
    registrationOpenDate: open,
    registrationCloseDate: close,
    durationLabel: e.time || "See details",
    seats: e.seats,
    taken: e.registered,
    hasLiveCounts: Number.isFinite(e.registered),
    price: e.price,
    href: `/events/${encodeURIComponent(e.slug)}`,
    registerHref: `/register/${encodeURIComponent(e.slug)}`,
    modules: [],
    extraMeta: e.venue,
  };
}

export function programStatus(p: HubProgram): ProgramStatus {
  return computeProgramStatus({
    startDate: p.startDate,
    endDate: p.endDate,
    registrationCloseDate: p.registrationCloseDate,
  });
}

export function statusLabel(status: ProgramStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "registration_closed":
      return "Registration Closed";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
  }
}

export function statusBadgeClass(status: ProgramStatus): string {
  switch (status) {
    case "upcoming":
      return "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan";
    case "registration_closed":
      return "border-amber-400/40 bg-amber-400/10 text-amber-300";
    case "in_progress":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "completed":
      return "border-border/60 bg-muted/40 text-muted-foreground";
  }
}

export function schemaEventStatus(status: ProgramStatus): string {
  if (status === "completed") return "https://schema.org/EventCompleted";
  if (status === "registration_closed") return "https://schema.org/EventScheduled";
  return "https://schema.org/EventScheduled";
}

/** Seat copy. Remaining-count line only when live registration counts exist. */
export function programSeatMessage(p: HubProgram): string {
  const status = programStatus(p);
  if (status === "in_progress") return "Cohort in progress";
  if (status === "completed") return "Cohort completed";

  const remaining =
    p.hasLiveCounts && p.seats > 0 ? Math.max(0, p.seats - Math.floor(p.taken)) : null;

  if (remaining === 0) return "Cohort full — Join waitlist";

  if (remaining != null && remaining > 0 && remaining <= FEW_SEATS_MAX && remaining < p.seats) {
    return remaining === 1 ? "Only 1 seat remaining" : `Only ${remaining} seats remaining`;
  }

  if (status === "registration_closed") {
    return `Registration closed ${formatProgramDateShort(p.registrationCloseDate)}`;
  }

  const today = todayIsoIST();
  const close = p.registrationCloseDate;
  const daysUntilClose = Math.round(
    (parseIso(close).getTime() - parseIso(today).getTime()) / 86_400_000,
  );
  if (daysUntilClose >= 0 && daysUntilClose <= 14) {
    return `Registration closes ${formatProgramDateShort(close)}`;
  }

  if (p.seats > 0) {
    return p.seats === 1 ? "Limited to 1 learner" : `Limited to ${p.seats} learners`;
  }
  return "Registration open";
}

export function isFounderMentor(name: string): boolean {
  return name.trim().toLowerCase() === FOUNDER_NAME.trim().toLowerCase();
}

export function waitlistMailto(programTitle: string): string {
  const subject = encodeURIComponent(`Waitlist: ${programTitle}`);
  const body = encodeURIComponent(
    `Hi Cloud Vaathi team,\n\nPlease add me to the waitlist / next intake for:\n${programTitle}\n\nThank you.`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function notifyReturnMailto(programTitle: string): string {
  const subject = encodeURIComponent(`Notify me: ${programTitle}`);
  const body = encodeURIComponent(
    `Hi Cloud Vaathi team,\n\nPlease notify me when this program returns:\n${programTitle}\n\nThank you.`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
