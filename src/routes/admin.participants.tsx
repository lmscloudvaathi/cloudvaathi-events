import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { participants, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/participants")({
  component: AdminParticipants,
});

function AdminParticipants() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "Course" | "Event">("All");

  const rows = useMemo(() => {
    return participants.filter((p) => {
      if (filter !== "All" && p.itemType !== filter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || p.itemTitle.toLowerCase().includes(s);
    });
  }, [q, filter]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// roster</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Participants</h1>
          <p className="mt-1 text-muted-foreground">Everyone registered for a course or event.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2.5 text-sm font-semibold hover:border-primary">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, course…"
            className="w-full rounded-lg border border-border/60 bg-input/40 py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-1 rounded-lg glass p-1">
          {(["All", "Course", "Event"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-gradient-neon text-primary-foreground glow-cyan" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">ID</th>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Contact</th>
                <th className="px-5 py-4 font-medium">Registered for</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-surface/40">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{p.id}</td>
                  <td className="px-5 py-4 font-semibold">{p.name}</td>
                  <td className="px-5 py-4">
                    <p className="text-xs">{p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs">{p.itemTitle}</p>
                    <p className="text-[10px] uppercase tracking-wider text-neon-cyan">{p.itemType}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold">{formatINR(p.amount)}</td>
                  <td className="px-5 py-4"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-4 text-muted-foreground">{p.registeredAt}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No participants match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
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
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
