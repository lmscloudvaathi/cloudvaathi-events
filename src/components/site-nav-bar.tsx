import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { JumpLink } from "@/components/jump-link";
import { eventsHref, marketingHref, useSiteMode } from "@/lib/site-mode";
import { lmsSiteUrl } from "@/lib/site-mode-shared";
import type { SiteMode } from "@/lib/site-mode-shared";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { id: "home", label: "Home", kind: "marketing", path: "/" },
  { id: "events", label: "Events", kind: "events", path: "/" },
  { id: "lms", label: "LMS", kind: "lms", path: "" },
  { id: "about", label: "About", kind: "marketing", path: "/about" },
  { id: "testimonials", label: "Testimonials", kind: "marketing", path: "/testimonials" },
] as const;

function isNavActive(id: (typeof NAV_ITEMS)[number]["id"], siteMode: SiteMode, pathname: string): boolean {
  if (id === "home") return siteMode === "marketing" && pathname === "/";
  if (id === "events") return siteMode === "events";
  if (id === "about") return siteMode === "marketing" && pathname === "/about";
  if (id === "testimonials") return siteMode === "marketing" && pathname === "/testimonials";
  return false;
}

function navHref(id: (typeof NAV_ITEMS)[number]["id"], siteMode: SiteMode): string {
  if (id === "lms") return lmsSiteUrl();
  if (id === "events") return eventsHref(siteMode, "/");
  if (id === "home") return marketingHref(siteMode, "/");
  if (id === "about") return marketingHref(siteMode, "/about");
  return marketingHref(siteMode, "/testimonials");
}

const linkClass =
  "shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors sm:px-4 sm:text-sm hover:text-foreground";

export function SiteNavBar() {
  const siteMode = useSiteMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex"
      aria-label="Main"
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.id, siteMode, pathname);
        return (
          <JumpLink
            key={item.id}
            href={navHref(item.id, siteMode)}
            newTab={item.id === "lms"}
            className={cn(linkClass, active && "bg-secondary/60 text-foreground")}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </JumpLink>
        );
      })}
    </nav>
  );
}

export function SiteMobileNav() {
  const siteMode = useSiteMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-secondary/60 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,20rem)] border-border/60 bg-background/95">
        <SheetHeader>
          <SheetTitle className="text-left font-display">Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.id, siteMode, pathname);
            return (
              <JumpLink
                key={item.id}
                href={navHref(item.id, siteMode)}
                newTab={item.id === "lms"}
                className={cn(
                  "rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  active && "bg-secondary/60 text-foreground",
                )}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </JumpLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
