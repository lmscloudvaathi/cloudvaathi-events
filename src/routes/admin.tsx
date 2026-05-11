import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Calendar, Cloud, GraduationCap, LayoutDashboard, Ticket, Users } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { meFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Cloud Vaathi" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin" as const, label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/courses" as const, label: "Courses", icon: GraduationCap },
  { to: "/admin/events" as const, label: "Events", icon: Calendar },
  { to: "/admin/coupons" as const, label: "Coupons", icon: Ticket },
  { to: "/admin/participants" as const, label: "Participants", icon: Users },
];

function AdminLayout() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setAllowed(false);
      return;
    }
    meFn({ data: { token } })
      .then((res) => setAllowed(res.user?.role === "admin"))
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) {
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <RoutePendingFallback />
          <p className="mt-2 text-xs text-muted-foreground">Checking administrator session…</p>
        </div>
      </div>
    );
  }
  if (!allowed) {
    const token = getSessionToken();
    return (
      <div className="relative min-h-screen">
        <AuroraBg />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {token
              ? "You are signed in, but this account is not an administrator."
              : "Sign in with an administrator account to open the console."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin-login"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan"
            >
              Administrator sign in
            </Link>
            {token ? (
              <Link to="/" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium">
                Back to site
              </Link>
            ) : (
              <Link to="/login" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium">
                Member sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border/50 glass">
          <Link to="/" className="flex items-center gap-2 px-6 py-5 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-neon glow-cyan">
              <Cloud className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-bold">Cloud Vaathi</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-neon-cyan">admin console</span>
            </div>
          </Link>

          <nav className="flex-1 p-3 space-y-1">
            {adminNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground data-[status=active]:bg-gradient-neon data-[status=active]:font-semibold data-[status=active]:text-white data-[status=active]:[text-shadow:0_1px_2px_rgb(0_0_0/0.45)] data-[status=active]:glow-cyan"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-neon" />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-[10px] text-muted-foreground">root@cloudvaathi</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-x-hidden">
          {/* Mobile top nav */}
          <div className="md:hidden flex gap-1 overflow-x-auto border-b border-border/50 glass px-3 py-3">
            {adminNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.exact }}
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground data-[status=active]:bg-gradient-neon data-[status=active]:font-semibold data-[status=active]:text-white data-[status=active]:[text-shadow:0_1px_2px_rgb(0_0_0/0.45)]"
              >
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            ))}
          </div>
          <AdminAuthedOutlet />
        </main>
      </div>
    </div>
  );
}

/** Outlet + loading overlay; mounts only when admin session is valid. */
function AdminAuthedOutlet() {
  const router = useRouter();
  const [sectionPulse, setSectionPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", (evt) => {
      if (!evt.pathChanged) return;
      if (!evt.toLocation.pathname.startsWith("/admin")) return;
      window.clearTimeout(pulseTimer.current);
      setSectionPulse(true);
      pulseTimer.current = window.setTimeout(() => {
        setSectionPulse(false);
        pulseTimer.current = undefined;
      }, 400);
    });
    return () => {
      unsub();
      window.clearTimeout(pulseTimer.current);
    };
  }, [router]);

  const loaderPending = useRouterState({
    select: (s) =>
      s.location.pathname.startsWith("/admin") &&
      s.matches.some((m) => m.routeId !== "__root__" && m.status === "pending"),
  });

  const showOverlay = sectionPulse || loaderPending;

  return (
    <div className="relative min-h-[50vh] p-6 md:p-10">
      {showOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex justify-center bg-background/35 pt-10 backdrop-blur-[1px] transition-opacity duration-200"
          aria-busy
        >
          <div className="flex h-10 items-center gap-2 rounded-full border border-border/70 bg-surface/95 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neon-cyan/25 border-t-neon-cyan" />
            Loading section…
          </div>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
