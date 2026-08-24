/** Derive syllabus sections from catalog fields only. Never invent extra labs, exams, or outcomes. */

export type SyllabusModule = { title: string; lessons: string[] };

const LAB_RE = /lab|hands-?on|workshop|exercise|practice|studio/i;
const ASSESS_RE = /assess|exam|capstone|mock|interview|project|quiz|certif/i;

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** 5–8 items when the catalog has enough lessons; fewer if that is all that is stored. */
export function learningOutcomesFromModules(modules: SyllabusModule[]): string[] {
  const lessons = modules.flatMap((m) => m.lessons);
  return unique(lessons).slice(0, 8);
}

export function labsFromModules(modules: SyllabusModule[]): string[] {
  return unique(
    modules.flatMap((m) => {
      const fromTitle = LAB_RE.test(m.title) ? m.lessons : [];
      return [...fromTitle, ...m.lessons.filter((l) => LAB_RE.test(l))];
    }),
  );
}

export function assessmentsFromModules(modules: SyllabusModule[]): string[] {
  return unique(
    modules.flatMap((m) => {
      const fromTitle = ASSESS_RE.test(m.title) ? m.lessons : [];
      return [...fromTitle, ...m.lessons.filter((l) => ASSESS_RE.test(l))];
    }),
  );
}

export function catalogMentionsLabs(text: string): boolean {
  return LAB_RE.test(text);
}

export function softwareFromCatalog(input: {
  title: string;
  description: string;
  tags?: string[];
  venue?: string;
}): string[] {
  const hay = [input.title, input.description, input.venue ?? "", ...(input.tags ?? [])].join(" ").toLowerCase();
  const items: string[] = [];
  const add = (test: RegExp, line: string) => {
    if (test.test(hay) && !items.includes(line)) items.push(line);
  };
  add(/\baws\b/, "AWS account");
  add(/azure|\baz-/, "Microsoft Azure account");
  add(/\bgcp\b|google cloud/, "Google Cloud account");
  add(/kubernetes|\bk8s\b/, "kubectl");
  add(/terraform/, "Terraform CLI");
  add(/docker|container/, "Docker Desktop (or equivalent)");
  add(/github|gitops|\bgit\b/, "GitHub account");
  add(/linux|bash|ssh/, "Terminal / SSH client");
  add(/playwright|selenium|javascript|node/, "Node.js 18+");
  add(/python/, "Python 3");
  add(/zoom|online|virtual|remote/, "Zoom or browser meeting access");
  add(/\bai\b|genai|llm|openai/, "Modern browser for labs and model consoles");
  add(/security|cyber|cism|cissp|ccsp/, "Modern browser for labs and exam portals");
  return items;
}

export function prerequisitesForEvent(type: string, venue: string): string[] {
  const online = /online|zoom|virtual|remote/i.test(venue);
  return [
    `${type} session — this is not a multi-week course, so there is no stored module or exam list.`,
    online
      ? "You need a laptop and a stable internet connection."
      : "Bring a laptop if the session includes hands-on work.",
  ];
}

export function prerequisitesFromCatalog(level: string, tags: string[]): string[] {
  const topics = tags.length > 0 ? tags.join(", ") : "the topics listed on this program";
  if (/beginner/i.test(level)) {
    return [
      `Pitched at ${level} level — no prior certification is required.`,
      "You should be comfortable using a computer, a browser, and email.",
    ];
  }
  if (/advanced/i.test(level)) {
    return [
      `Pitched at ${level} level — prior hands-on experience with ${topics} is expected.`,
      "Read the curriculum below and confirm it matches where you are today before you register.",
    ];
  }
  return [
    `Pitched at ${level} level — working familiarity with ${topics} is expected.`,
    "Read the curriculum below and confirm it matches where you are today before you register.",
  ];
}
