import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Calendar, GraduationCap, IndianRupee, TrendingUp, Users } from "lucide-react";
import { formatINR } from "@/lib/mock-data";
import { adminDashboardFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({
    revenue: 0,
    enrolledLearners: 0,
    eventRegistrations: 0,
    activeParticipants: 0,
  });
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    adminDashboardFn({ data: { token } }).then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Revenue (₹)", value: formatINR(stats.revenue), icon: IndianRupee, trend: "+18%" },
    { label: "Enrolled learners", value: stats.enrolledLearners.toString(), icon: GraduationCap, trend: "+12%" },
    { label: "Event registrations", value: stats.eventRegistrations.toString(), icon: Calendar, trend: "+24%" },
    { label: "Active participants", value: stats.activeParticipants.toString(), icon: Users, trend: "+6%" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Mission Control</h1>
        <p className="mt-1 text-muted-foreground">Operational view of cohorts, events and revenue.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl glass p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-neon opacity-10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-neon glow-cyan">
                <s.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-neon-cyan">
                <TrendingUp className="h-3 w-3" /> {s.trend}
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Cohort fill rate</h3>
            <Activity className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="mt-5 space-y-4">
            {[{ title: "DB-driven view", pct: 100 }].map((c) => {
              const pct = c.pct;
              return (
                <div key={c.title}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-4">{c.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                    <div className="h-full bg-gradient-neon" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl glass p-6">
          <h3 className="font-display text-lg font-semibold">Recent participants</h3>
          <div className="mt-5 divide-y divide-border/50">
            <p className="py-3 text-sm text-muted-foreground">
              Open Participants tab for live enrollment rows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

