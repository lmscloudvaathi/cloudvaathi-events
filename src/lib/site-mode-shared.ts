export type SiteMode = "marketing" | "events";

export const EVENTS_HOSTS = new Set(["events.cloudvaathi.in", "www.events.cloudvaathi.in"]);

/** Fixed ports for `npm run dev:marketing` / `dev:events` (see package.json). */
export const LOCAL_MARKETING_PORT = 8080;
export const LOCAL_EVENTS_PORT = 8081;

export const MARKETING_SITE_URL = import.meta.env.VITE_MARKETING_SITE_URL ?? "https://cloudvaathi.in";
export const EVENTS_SITE_URL = import.meta.env.VITE_EVENTS_SITE_URL ?? "https://events.cloudvaathi.in";
export const LMS_SITE_URL = import.meta.env.VITE_LMS_SITE_URL ?? "https://lms.cloudvaathi.in";

export function modeFromHost(host: string): SiteMode | null {
  const h = host.toLowerCase();
  if (EVENTS_HOSTS.has(h)) return "events";
  if (h === "cloudvaathi.in" || h === "www.cloudvaathi.in") return "marketing";
  return null;
}

/** On localhost, pick surface from dev server port. */
export function modeFromLocalPort(port: string | number | undefined): SiteMode | null {
  const p = Number(port);
  if (p === LOCAL_MARKETING_PORT) return "marketing";
  if (p === LOCAL_EVENTS_PORT) return "events";
  return null;
}

export function eventsSiteUrl(path = "/"): string {
  const base = EVENTS_SITE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function marketingSiteUrl(path = "/"): string {
  const base = MARKETING_SITE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function lmsSiteUrl(): string {
  return LMS_SITE_URL.replace(/\/$/, "");
}
