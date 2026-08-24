import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/mock-data";
import { categoryFromProgramName } from "@/lib/program-lifecycle";
import {
  adminCoursesFn,
  adminCreateCourseFn,
  adminDeleteCourseFn,
  adminHardDeleteCourseFn,
  adminRestoreCourseFn,
} from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const location = useLocation();
  const [courses, setCourses] = useState<
    Array<{
      slug: string;
      title: string;
      level: string;
      start_date: string;
      seats: number;
      enrolled: number;
      price: number;
      instructor: string;
      active: number;
    }>
  >([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    price: 0,
    seats: 30,
    startDate: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
  });

  const load = () => {
    const token = getSessionToken();
    if (!token) return;
    adminCoursesFn({ data: { token } }).then(setCourses).catch(() => {});
  };
  useEffect(load, []);

  if (location.pathname !== "/admin/courses") {
    return <Outlet />;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// catalog</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Courses</h1>
          <p className="mt-1 text-muted-foreground">Publish, edit and archive cohort offerings.</p>
        </div>
        <p className="text-xs text-muted-foreground">Live records from TiDB</p>
      </header>
      <form
        className="space-y-4 rounded-2xl glass p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const token = getSessionToken();
          if (!token) return;
          await adminCreateCourseFn({ data: { token, ...form } });
          setForm({ slug: "", title: "", price: 0, seats: 30, startDate: "", level: "Beginner" });
          load();
        }}
      >
        <div>
          <p className="text-sm font-semibold">Add new course</p>
          <p className="text-xs text-muted-foreground">Use clear names so the catalog is easy to manage later.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Course slug</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" placeholder="aws-solutions-architect" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Course title</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" placeholder="AWS Solutions Architect - Pro Track" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Price (INR)</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="number" min={0} placeholder="14999" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total seats</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="number" min={1} placeholder="40" value={form.seats} onChange={(e) => setForm((s) => ({ ...s, seats: Number(e.target.value) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Start date</span>
            <input required className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
          </label>
        </div>
        <div className="flex justify-end">
          <button className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-primary-foreground">Add Course</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Course</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Level</th>
                <th className="px-5 py-4 font-medium">Starts</th>
                <th className="px-5 py-4 font-medium">Seats</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {courses.map((c) => {
                const pct = Math.round((c.enrolled / c.seats) * 100);
                return (
                  <tr key={c.slug} className="transition-colors hover:bg-surface/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.instructor}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neon-cyan">
                        {categoryFromProgramName(c.title, c.slug)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">{c.level}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {c.start_date
                        ? new Date(c.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "TBD"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                          <div className="h-full bg-gradient-neon" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{c.enrolled}/{c.seats}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold">{formatINR(c.price)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          c.active ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {c.active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        <a
                          href={`/admin/courses/${c.slug}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </a>
                        {c.active ? (
                          <button
                            className="text-xs text-destructive"
                            onClick={async () => {
                              const token = getSessionToken();
                              if (!token) return;
                              await adminDeleteCourseFn({ data: { token, slug: c.slug } });
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
                              await adminRestoreCourseFn({ data: { token, slug: c.slug } });
                              load();
                            }}
                          >
                            Restore
                          </button>
                        )}
                        <button
                          className="text-xs text-destructive/80"
                          onClick={async () => {
                            if (!window.confirm("Delete this course permanently?")) return;
                            const token = getSessionToken();
                            if (!token) return;
                            await adminHardDeleteCourseFn({ data: { token, slug: c.slug } });
                            load();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
