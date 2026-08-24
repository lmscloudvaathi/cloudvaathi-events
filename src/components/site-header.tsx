import { Link, useRouter } from "@tanstack/react-router";
import { LayoutList, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { JumpLink } from "@/components/jump-link";
import { SiteMobileNav, SiteNavBar } from "@/components/site-nav-bar";
import { useSessionUser } from "@/hooks/use-session-user";
import { eventsHref, useIsEventsSite, useSiteMode } from "@/lib/site-mode";
import { clearSessionToken } from "@/lib/session-client";

/** Shared header: Home · Events · LMS · Testimonials on both marketing and events apps. */
export function SiteHeader() {
  const showAuth = useIsEventsSite();
  const siteMode = useSiteMode();
  const { user, loading } = useSessionUser();
  const router = useRouter();

  function signOut() {
    clearSessionToken();
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <BrandLogo linked size="md" className="min-w-0 shrink" showTagline={false} />

        <SiteNavBar />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showAuth ? (
            loading ? (
              <span className="hidden h-8 w-20 animate-pulse rounded-md bg-muted/40 sm:inline" aria-hidden />
            ) : user ? (
              <>
                <span
                  className="hidden max-w-[120px] truncate text-xs text-muted-foreground lg:inline"
                  title={user.email}
                >
                  Hi, {user.name.split(" ")[0]}
                </span>
                <Link
                  to="/my-registrations"
                  className="hidden items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 sm:inline-flex"
                  title="My registrations"
                >
                  <LayoutList className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  search={{ redirect: undefined }}
                  className="hidden rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  search={{ redirect: undefined }}
                  className="inline-flex items-center rounded-md bg-gradient-neon px-3 py-2 text-sm font-semibold text-black shadow-md transition-transform hover:scale-[1.03] glow-cyan"
                >
                  Join now
                </Link>
              </>
            )
          ) : (
            <>
              <JumpLink
                href={eventsHref(siteMode, "/login")}
                className="hidden rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Sign in
              </JumpLink>
              <JumpLink
                href={eventsHref(siteMode, "/signup")}
                className="inline-flex items-center rounded-md bg-gradient-neon px-3 py-2 text-sm font-semibold text-black shadow-md transition-transform hover:scale-[1.03] glow-cyan"
              >
                Join now
              </JumpLink>
            </>
          )}
          <SiteMobileNav />
        </div>
      </div>
    </header>
  );
}
