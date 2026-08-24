import { useRouterState } from "@tanstack/react-router";
import { useSiteMode } from "@/lib/site-mode";
import { eventsSiteUrl, lmsSiteUrl, marketingSiteUrl } from "@/lib/site-mode-shared";
import type { SiteMode } from "@/lib/site-mode-shared";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: () => marketingSiteUrl("/") },
  { id: "events", label: "Events", href: () => eventsSiteUrl("/") },
  { id: "lms", label: "LMS", href: () => lmsSiteUrl() },
  { id: "about", label: "About", href: () => marketingSiteUrl("/about") },
  { id: "testimonials", label: "Testimonials", href: () => marketingSiteUrl("/testimonials") },
] as const;

function isNavActive(id: (typeof NAV_ITEMS)[number]["id"], siteMode: SiteMode, pathname: string): boolean {
  if (id === "home") return siteMode === "marketing" && pathname === "/";
  if (id === "events") return siteMode === "events";
  if (id === "about") return siteMode === "marketing" && pathname === "/about";
  if (id === "testimonials") return siteMode === "marketing" && pathname === "/testimonials";
  return false;
}

const linkClass =
  "rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors sm:px-4 sm:text-sm hover:text-foreground";

export function SiteNavBar() {
  const siteMode = useSiteMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto sm:gap-1"
      aria-label="Main"
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.id, siteMode, pathname);
        const href =
          item.id === "events" && siteMode === "events"
            ? "/"
            : item.id === "home" && siteMode === "marketing"
              ? "/"
              : item.href();
        return (
          <a
            key={item.id}
            href={href}
            className={cn(
              linkClass,
              active && "text-foreground bg-secondary/60",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
