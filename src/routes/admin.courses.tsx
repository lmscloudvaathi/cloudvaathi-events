import { createFileRoute } from "@tanstack/react-router";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { courses, formatINR } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// catalog</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Courses</h1>
          <p className="mt-1 text-muted-foreground">Publish, edit and archive cohort offerings.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-cyan transition-transform hover:scale-[1.03]">
          <Plus className="h-4 w-4" /> New course
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Course</th>
                <th className="px-5 py-4 font-medium">Level</th>
                <th className="px-5 py-4 font-medium">Starts</th>
                <th className="px-5 py-4 font-medium">Seats</th>
                <th className="px-5 py-4 font-medium">Price</th>
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
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">{c.level}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary/60 hover:text-primary"><Edit3 className="h-4 w-4" /></button>
                        <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
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
