import { redirect } from "@tanstack/react-router";
import { eventsSiteUrl, marketingSiteUrl, type SiteMode } from "./site-mode-shared";

const MARKETING_ONLY = new Set(["/", "/testimonials"]);

const EVENTS_PREFIXES = [
  "/courses",
  "/events",
  "/login",
  "/signup",
  "/register",
  "/my-registrations",
  "/admin",
  "/admin-login",
];

function isEventsAppPath(pathname: string): boolean {
  return EVENTS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function enforceSiteAccess(pathname: string, siteMode: SiteMode): void {
  if (siteMode === "marketing") {
    if (isEventsAppPath(pathname)) {
      throw redirect({ href: eventsSiteUrl(pathname) });
    }
    return;
  }

  if (pathname === "/testimonials") {
    throw redirect({ href: marketingSiteUrl("/testimonials") });
  }
}

export function shouldRedirectCatalogListToHome(pathname: string, siteMode: SiteMode): boolean {
  return siteMode === "events" && (pathname === "/courses" || pathname === "/events");
}
