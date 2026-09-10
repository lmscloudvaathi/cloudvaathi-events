import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { defaultEventLifecycleDates, formatDateForInput } from "@/lib/format-date-input";
import { adminCloneEventFn, adminEventBySlugFn, adminUpdateEventFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/events/$slug")({
  component: AdminEventEditor,
});

function AdminEventEditor() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [form, setForm] = useState({
    slug,
    title: "",
    type: "Workshop" as "Workshop" | "Tech Talk" | "Hackathon" | "Meetup",
    date: "",
    time: "",
    venue: "",
    price: 0,
    seats: 50,
    description: "",
    speakersText: "",
    registrationOpenDate: "",
    registrationCloseDate: "",
    programEndDate: "",
    active: true,
  });

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    setLoading(true);
    adminEventBySlugFn({ data: { token, slug } })
      .then((e) => {
        if (!e) return;
        setForm({
          slug: e.slug,
          title: e.title,
          type: e.type,
          date: formatDateForInput(e.date),
          time: e.time,
          venue: e.venue,
          price: e.price,
          seats: e.seats,
          description: e.description,
          speakersText: e.speakers.join(", "),
          registrationOpenDate: formatDateForInput(e.registrationOpenDate),
          registrationCloseDate: formatDateForInput(e.registrationCloseDate),
          programEndDate: formatDateForInput(e.programEndDate),
          active: !!e.active,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading event...</div>;

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const staleClose =
    form.date &&
    form.registrationCloseDate &&
    form.registrationCloseDate < form.date &&
    form.registrationCloseDate <= today &&
    form.date > today;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Edit event</h1>
          <p className="text-sm text-muted-foreground">{form.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded border border-border/60 px-3 py-1.5 text-xs font-semibold text-neon-cyan disabled:opacity-50"
            disabled={cloning || saving}
            onClick={async () => {
              const token = getSessionToken();
              if (!token) return;
              setError("");
              setSavedMsg("");
              setCloning(true);
              try {
                const result = await adminCloneEventFn({
                  data: { token, slug: form.slug, publish: false },
                });
                await navigate({ to: "/admin/events/$slug", params: { slug: result.slug } });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Clone failed");
              } finally {
                setCloning(false);
              }
            }}
          >
            {cloning ? "Cloning…" : "Clone as draft"}
          </button>
          <Link to="/admin/events" className="text-sm text-primary hover:underline">
            Back to events
          </Link>
        </div>
      </div>

      {staleClose ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Registration close date ({form.registrationCloseDate}) is in the past while the event is still upcoming.
          The public site will show <strong>Registration Closed</strong> until you update the registration window
          below (or change the event date, which resets the window).
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
            const speakers = form.speakersText
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            await adminUpdateEventFn({
              data: {
                token,
                slug: form.slug,
                title: form.title,
                type: form.type,
                date: form.date,
                time: form.time,
                venue: form.venue,
                price: form.price,
                seats: form.seats,
                description: form.description,
                speakers,
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
          <Input label="Type" value={form.type} onChange={(v) => setForm((s) => ({ ...s, type: v as typeof form.type }))} />
          <Input
            label="Event date"
            type="date"
            value={form.date}
            onChange={(v) => {
              const lifecycle = defaultEventLifecycleDates(v);
              setForm((s) => ({
                ...s,
                date: v,
                registrationOpenDate: lifecycle.registrationOpenDate,
                registrationCloseDate: lifecycle.registrationCloseDate,
                programEndDate: lifecycle.programEndDate,
              }));
            }}
          />
          <Input label="Time" value={form.time} onChange={(v) => setForm((s) => ({ ...s, time: v }))} />
          <Input label="Venue" value={form.venue} onChange={(v) => setForm((s) => ({ ...s, venue: v }))} />
          <Input label="Price" type="number" value={String(form.price)} onChange={(v) => setForm((s) => ({ ...s, price: Number(v) }))} />
          <Input label="Seats" type="number" value={String(form.seats)} onChange={(v) => setForm((s) => ({ ...s, seats: Number(v) }))} />
          <Input label="Speakers (comma separated)" value={form.speakersText} onChange={(v) => setForm((s) => ({ ...s, speakersText: v }))} />
        </div>

        <div className="space-y-2 rounded-xl border border-border/50 bg-background/30 p-4">
          <p className="text-sm font-semibold">Registration window</p>
          <p className="text-xs text-muted-foreground">
            The public site uses these dates for Upcoming / Registration Closed / In progress. Changing the event date
            resets this window (open 21 days before; close and end on event day).
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

        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Description</span>
          <textarea className="min-h-28 w-full rounded border bg-input/40 px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
          Published (visible on the public events site)
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {savedMsg ? <p className="text-xs text-emerald-300">{savedMsg}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
            disabled={saving || cloning}
          >
            {saving ? "Saving..." : form.active ? "Save & publish" : "Save draft"}
          </button>
        </div>
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
