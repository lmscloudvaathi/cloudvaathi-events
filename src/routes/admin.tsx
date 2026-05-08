import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Calendar, Cloud, GraduationCap, LayoutDashboard, Users } from "lucide-react";
import { AuroraBg } from "@/components/aurora-bg";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Cloud Vaathi" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin" as const, label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/courses" as const, label: "Courses", icon: GraduationCap },
  { to: "/admin/events" as const, label: "Events", icon: Calendar },
  { to: "/admin/participants" as const, label: "Participants", icon: Users },
];

function AdminLayout() {
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
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground data-[status=active]:bg-gradient-neon data-[status=active]:text-primary-foreground data-[status=active]:font-semibold data-[status=active]:glow-cyan"
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
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground data-[status=active]:bg-gradient-neon data-[status=active]:text-primary-foreground"
              >
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </Link>
            ))}
          </div>
          <div className="p-6 md:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
