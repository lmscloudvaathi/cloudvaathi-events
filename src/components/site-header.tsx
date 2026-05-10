import { Link, useRouter } from "@tanstack/react-router";
import { Cloud, LayoutList, LogOut } from "lucide-react";
import { useSessionUser } from "@/hooks/use-session-user";
import { clearSessionToken } from "@/lib/session-client";

const nav = [
  { to: "/" as const, label: "Home" },
  { to: "/courses" as const, label: "Courses" },
  { to: "/events" as const, label: "Events" },
];

export function SiteHeader() {
  const { user, loading } = useSessionUser();
  const router = useRouter();

  function signOut() {
    clearSessionToken();
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-neon glow-cyan">
            <Cloud className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight">Cloud Vaathi</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              learn · build · ship
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:bg-secondary/60"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="hidden sm:inline h-8 w-24 animate-pulse rounded-md bg-muted/40" aria-hidden />
          ) : user ? (
            <>
              <span className="hidden sm:inline max-w-[140px] truncate text-xs text-muted-foreground" title={user.email}>
                Hi, {user.name.split(" ")[0]}
              </span>
              <Link
                to="/my-registrations"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60"
              >
                <LayoutList className="h-4 w-4" />
                My registrations
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center rounded-md bg-gradient-neon px-4 py-2 text-sm font-semibold text-black shadow-md transition-transform hover:scale-[1.03] glow-cyan"
              >
                Join now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
