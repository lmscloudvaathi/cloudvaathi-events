import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { defaultCourseLifecycleDates, formatDateForInput } from "@/lib/format-date-input";
import { adminCourseBySlugFn, adminUpdateCourseFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

type Module = { title: string; lessons: string[] };

export const Route = createFileRoute("/admin/courses/$slug")({
  component: AdminCourseEditor,
});

function AdminCourseEditor() {
  const { slug } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [form, setForm] = useState({
    slug,
    title: "",
    tagline: "",
    description: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    duration: "",
    startDate: "",
    price: 0,
    seats: 30,
    instructor: "",
    tagsText: "",
    modules: [{ title: "", lessons: [""] }] as Module[],
    registrationOpenDate: "",
    registrationCloseDate: "",
    programEndDate: "",
    active: true,
  });

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    adminCourseBySlugFn({ data: { token, slug } })
      .then((c) => {
        if (!c) return;
        setForm({
          slug: c.slug,
          title: c.title,
          tagline: c.tagline,
          description: c.description,
          level: c.level,
          duration: c.duration,
          startDate: formatDateForInput(c.startDate),
          price: c.price,
          seats: c.seats,
          instructor: c.instructor,
          tagsText: c.tags.join(", "),
          modules: c.modules.length ? c.modules : [{ title: "", lessons: [""] }],
          registrationOpenDate: formatDateForInput(c.registrationOpenDate),
          registrationCloseDate: formatDateForInput(c.registrationCloseDate),
          programEndDate: formatDateForInput(c.programEndDate),
          active: !!c.active,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading course...</div>;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const staleClose =
    form.startDate &&
    form.registrationCloseDate &&
    form.registrationCloseDate < form.startDate &&
    form.registrationCloseDate <= today &&
    form.startDate > today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Edit course</h1>
          <p className="text-sm text-muted-foreground">{form.slug}</p>
        </div>
        <Link to="/admin/courses" className="text-sm text-primary hover:underline">
          Back to courses
        </Link>
      </div>

      {staleClose ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Registration close date ({form.registrationCloseDate}) is in the past while the course starts{" "}
          {form.startDate}. The public site will show <strong>Registration Closed</strong> until you update the
          registration window below (or change the start date, which resets the window).
        </p>
      ) : null}

      <form
        className="space-y-4 rounded-2xl glass p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setSavedMsg("");
          const token = getSessionToken();
          if (!token) return;
          try {
            setSaving(true);
            const tags = form.tagsText
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            const modules = form.modules
              .map((m) => ({
                title: m.title.trim(),
                lessons: m.lessons.map((l) => l.trim()).filter(Boolean),
              }))
              .filter((m) => m.title.length > 0);
            await adminUpdateCourseFn({
              data: {
                token,
                slug: form.slug,
                title: form.title,
                tagline: form.tagline,
                description: form.description,
                level: form.level,
                duration: form.duration,
                startDate: form.startDate,
                price: form.price,
                seats: form.seats,
                instructor: form.instructor,
                tags,
                modules,
                registrationOpenDate: form.registrationOpenDate,
                registrationCloseDate: form.registrationCloseDate,
                programEndDate: form.programEndDate,
                active: form.active,
              },
            });
            setSavedMsg(form.active ? "Saved and published." : "Saved as draft (unpublished).");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(v) => setForm((s) => ({ ...s, title: v }))} />
          <Input label="Tagline" value={form.tagline} onChange={(v) => setForm((s) => ({ ...s, tagline: v }))} />
          <Input label="Instructor" value={form.instructor} onChange={(v) => setForm((s) => ({ ...s, instructor: v }))} />
          <Input label="Duration" value={form.duration} onChange={(v) => setForm((s) => ({ ...s, duration: v }))} />
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(v) => {
              const lifecycle = defaultCourseLifecycleDates(v);
              setForm((s) => ({
                ...s,
                startDate: v,
                registrationOpenDate: lifecycle.registrationOpenDate,
                registrationCloseDate: lifecycle.registrationCloseDate,
                programEndDate: lifecycle.programEndDate,
              }));
            }}
          />
          <Input label="Level" value={form.level} onChange={(v) => setForm((s) => ({ ...s, level: v as typeof form.level }))} />
          <Input label="Price" type="number" value={String(form.price)} onChange={(v) => setForm((s) => ({ ...s, price: Number(v) }))} />
          <Input label="Seats" type="number" value={String(form.seats)} onChange={(v) => setForm((s) => ({ ...s, seats: Number(v) }))} />
        </div>

        <div className="space-y-2 rounded-xl border border-border/50 bg-background/30 p-4">
          <p className="text-sm font-semibold">Registration window</p>
          <p className="text-xs text-muted-foreground">
            The public site uses these dates for Upcoming / Registration Closed / In progress. Changing the start date
            resets this window (open 30 days before; close and end on start day).
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label="Registration opens"
              type="date"
              value={form.registrationOpenDate}
              onChange={(v) => setForm((s) => ({ ...s, registrationOpenDate: v }))}
            />
            <Input
              label="Registration closes"
              type="date"
              value={form.registrationCloseDate}
              onChange={(v) => setForm((s) => ({ ...s, registrationCloseDate: v }))}
            />
            <Input
              label="Program end"
              type="date"
              value={form.programEndDate}
              onChange={(v) => setForm((s) => ({ ...s, programEndDate: v }))}
            />
          </div>
        </div>

        <Input label="Tags (comma separated)" value={form.tagsText} onChange={(v) => setForm((s) => ({ ...s, tagsText: v }))} />
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Description</span>
          <textarea className="min-h-28 w-full rounded border bg-input/40 px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <div className="space-y-3 rounded-xl border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Curriculum modules</span>
            <button
              type="button"
              className="rounded border border-border px-2 py-1 text-xs"
              onClick={() =>
                setForm((s) => ({
                  ...s,
                  modules: [...s.modules, { title: "", lessons: [""] }],
                }))
              }
            >
              + Add module
            </button>
          </div>
          {form.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="space-y-2 rounded-lg bg-surface/40 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded border bg-input/40 px-3 py-2 text-sm"
                  placeholder={`Module ${moduleIndex + 1} title`}
                  value={module.title}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      modules: s.modules.map((m, i) =>
                        i === moduleIndex ? { ...m, title: e.target.value } : m,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive"
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      modules:
                        s.modules.length > 1
                          ? s.modules.filter((_, i) => i !== moduleIndex)
                          : [{ title: "", lessons: [""] }],
                    }))
                  }
                >
                  Remove
                </button>
              </div>
              <div className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lessonIndex} className="flex items-center gap-2">
                    <input
                      className="w-full rounded border bg-input/40 px-3 py-2 text-sm"
                      placeholder={`Lesson ${lessonIndex + 1}`}
                      value={lesson}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          modules: s.modules.map((m, i) =>
                            i === moduleIndex
                              ? {
                                  ...m,
                                  lessons: m.lessons.map((l, li) =>
                                    li === lessonIndex ? e.target.value : l,
                                  ),
                                }
                              : m,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          modules: s.modules.map((m, i) =>
                            i === moduleIndex
                              ? {
                                  ...m,
                                  lessons:
                                    m.lessons.length > 1
                                      ? m.lessons.filter((_, li) => li !== lessonIndex)
                                      : [""],
                                }
                              : m,
                          ),
                        }))
                      }
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded border border-border px-2 py-1 text-xs"
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      modules: s.modules.map((m, i) =>
                        i === moduleIndex ? { ...m, lessons: [...m.lessons, ""] } : m,
                      ),
                    }))
                  }
                >
                  + Add lesson
                </button>
              </div>
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
          Published (visible on the public site)
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {savedMsg ? <p className="text-xs text-emerald-300">{savedMsg}</p> : null}
        <button
          type="submit"
          className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : form.active ? "Save & publish" : "Save draft"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input className="w-full rounded border bg-input/40 px-3 py-2 text-sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
