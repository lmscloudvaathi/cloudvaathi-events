import { createFileRoute } from "@tanstack/react-router";
import { Activity, Calendar, GraduationCap, IndianRupee, TrendingUp, Users } from "lucide-react";
import { courses, events, participants, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const totalRevenue = participants.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalEnrolled = courses.reduce((s, c) => s + c.enrolled, 0);
  const totalEventReg = events.reduce((s, e) => s + e.registered, 0);

  const stats = [
    { label: "Revenue (₹)", value: formatINR(totalRevenue), icon: IndianRupee, trend: "+18%" },
    { label: "Enrolled learners", value: totalEnrolled.toString(), icon: GraduationCap, trend: "+12%" },
    { label: "Event registrations", value: totalEventReg.toString(), icon: Calendar, trend: "+24%" },
    { label: "Active participants", value: participants.length.toString(), icon: Users, trend: "+6%" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Mission Control</h1>
        <p className="mt-1 text-muted-foreground">Operational view of cohorts, events and revenue.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
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
            {courses.map((c) => {
              const pct = Math.round((c.enrolled / c.seats) * 100);
              return (
                <div key={c.slug}>
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
            {participants.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.itemTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatINR(p.amount)}</p>
                  <StatusPill status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40",
    Pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
    Refunded: "bg-destructive/15 text-destructive border-destructive/40",
  };
  return (
    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
