import { Link, useRouter } from "@tanstack/react-router";
import { LayoutList, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteNavBar } from "@/components/site-nav-bar";
import { useSessionUser } from "@/hooks/use-session-user";
import { useIsEventsSite } from "@/lib/site-mode";
import { marketingSiteUrl } from "@/lib/site-mode-shared";
import { clearSessionToken } from "@/lib/session-client";

/** Shared header: Home · Events · LMS · Testimonials on both marketing and events apps. */
export function SiteHeader() {
  const showAuth = useIsEventsSite();
  const { user, loading } = useSessionUser();
  const router = useRouter();

  function signOut() {
    clearSessionToken();
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandLogo linked homeHref={marketingSiteUrl("/")} size="md" />

        <SiteNavBar />

        {showAuth ? (
          <div className="flex shrink-0 items-center gap-2">
            {loading ? (
              <span className="hidden sm:inline h-8 w-20 animate-pulse rounded-md bg-muted/40" aria-hidden />
            ) : user ? (
              <>
                <span
                  className="hidden lg:inline max-w-[120px] truncate text-xs text-muted-foreground"
                  title={user.email}
                >
                  Hi, {user.name.split(" ")[0]}
                </span>
                <Link
                  to="/my-registrations"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-secondary/60"
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
                  className="hidden sm:inline-flex rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center rounded-md bg-gradient-neon px-3 py-2 text-sm font-semibold text-black shadow-md transition-transform hover:scale-[1.03] glow-cyan"
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
