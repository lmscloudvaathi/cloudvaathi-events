import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/mock-data";
import { categoryFromProgramName } from "@/lib/program-lifecycle";
import {
  adminCreateEventFn,
  adminDeleteEventFn,
  adminEventsFn,
  adminHardDeleteEventFn,
  adminRestoreEventFn,
} from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/events")({
  component: AdminEvents,
});

function AdminEvents() {
  const location = useLocation();
  const [events, setEvents] = useState<
    Array<{
      slug: string;
      title: string;
      type: string;
      event_date: string;
      venue: string;
      seats: number;
      registered: number;
      price: number;
      active: number;
    }>
  >([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    date: "",
    type: "Workshop" as "Workshop" | "Tech Talk" | "Hackathon" | "Meetup",
    venue: "",
    price: 0,
    seats: 50,
  });

  const load = () => {
    const token = getSessionToken();
    if (!token) return;
    adminEventsFn({ data: { token } }).then(setEvents).catch(() => {});
  };
  useEffect(load, []);

  if (location.pathname !== "/admin/events") {
    return <Outlet />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// programming</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Events</h1>
          <p className="mt-1 text-muted-foreground">Manage workshops, hackathons, summits and meetups.</p>
        </div>
        <p className="text-xs text-muted-foreground">Live records from TiDB</p>
      </header>
      <form
        className="space-y-4 rounded-2xl glass p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const token = getSessionToken();
          if (!token) return;
          await adminCreateEventFn({ data: { token, ...form } });
          setForm({ slug: "", title: "", date: "", type: "Workshop", venue: "", price: 0, seats: 50 });
          load();
        }}
      >
        <div>
          <p className="text-sm font-semibold">Add new event</p>
          <p className="text-xs text-muted-foreground">Enter event details exactly as they should appear to users.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Event slug</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" placeholder="cloud-native-summit-2026" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Event title</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" placeholder="Cloud Native Summit 2026" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Event date</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Venue</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" placeholder="Chennai Trade Centre" value={form.venue} onChange={(e) => setForm((s) => ({ ...s, venue: e.target.value }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Ticket price (INR)</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="number" min={0} placeholder="999" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total seats</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="number" min={1} placeholder="200" value={form.seats} onChange={(e) => setForm((s) => ({ ...s, seats: Number(e.target.value) }))} />
          </label>
        </div>
        <div className="flex justify-end">
          <button className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-primary-foreground">Add Event</button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => {
          const pct = Math.round((e.registered / e.seats) * 100);
          return (
            <div key={e.slug} className="rounded-2xl glass p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                    {categoryFromProgramName(e.title, e.slug)} · {e.type}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold">{e.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{e.venue} · {new Date(e.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`/admin/events/${e.slug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </a>
                  {e.active ? (
                    <button
                      className="text-xs text-destructive"
                      onClick={async () => {
                        const token = getSessionToken();
                        if (!token) return;
                        await adminDeleteEventFn({ data: { token, slug: e.slug } });
                        load();
                      }}
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      className="text-xs text-emerald-300"
                      onClick={async () => {
                        const token = getSessionToken();
                        if (!token) return;
                        await adminRestoreEventFn({ data: { token, slug: e.slug } });
                        load();
                      }}
                    >
                      Restore
                    </button>
                  )}
                  <button
                    className="text-xs text-destructive/80"
                    onClick={async () => {
                      if (!window.confirm("Delete this event permanently?")) return;
                      const token = getSessionToken();
                      if (!token) return;
                      await adminHardDeleteEventFn({ data: { token, slug: e.slug } });
                      load();
                    }}
                  >
                    Delete
                  </button>
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
                <span className="text-xs text-muted-foreground">{e.active ? "Ticket" : "Ticket · Archived"}</span>
                <span className="font-display text-lg font-bold text-gradient-neon">{formatINR(e.price)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
