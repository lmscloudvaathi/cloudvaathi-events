import { createFileRoute } from "@tanstack/react-router";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { events, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/events")({
  component: AdminEvents,
});

function AdminEvents() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// programming</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">Manage workshops, hackathons, summits and meetups.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.03]">
          <Plus className="h-4 w-4" /> New event
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => {
          const pct = Math.round((e.registered / e.seats) * 100);
          return (
            <div key={e.slug} className="rounded-2xl glass p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">{e.type}</span>
                  <h3 className="mt-3 font-display text-lg font-bold">{e.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{e.venue} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary/60 hover:text-primary"><Edit3 className="h-4 w-4" /></button>
                  <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-mono">{e.registered}/{e.seats}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                  <div className="h-full bg-gradient-neon" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-xs text-muted-foreground">Ticket</span>
                <span className="font-display text-lg font-bold text-gradient-neon">{formatINR(e.price)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
