import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDateForInput } from "@/lib/format-date-input";
import { adminEventBySlugFn, adminUpdateEventFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/events/$slug")({
  component: AdminEventEditor,
});

function AdminEventEditor() {
  const { slug } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    active: true,
  });

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
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
          active: !!e.active,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-6">Loading event...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Edit event</h1>
          <p className="text-sm text-muted-foreground">{form.slug}</p>
        </div>
        <Link to="/admin/events" className="text-sm text-primary hover:underline">
          Back to events
        </Link>
      </div>

      <form
        className="space-y-4 rounded-2xl glass p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
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
                active: form.active,
              },
            });
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
          <Input label="Date" type="date" value={form.date} onChange={(v) => setForm((s) => ({ ...s, date: v }))} />
          <Input label="Time" value={form.time} onChange={(v) => setForm((s) => ({ ...s, time: v }))} />
          <Input label="Venue" value={form.venue} onChange={(v) => setForm((s) => ({ ...s, venue: v }))} />
          <Input label="Price" type="number" value={String(form.price)} onChange={(v) => setForm((s) => ({ ...s, price: Number(v) }))} />
          <Input label="Seats" type="number" value={String(form.seats)} onChange={(v) => setForm((s) => ({ ...s, seats: Number(v) }))} />
          <Input label="Speakers (comma separated)" value={form.speakersText} onChange={(v) => setForm((s) => ({ ...s, speakersText: v }))} />
        </div>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Description</span>
          <textarea className="min-h-28 w-full rounded border bg-input/40 px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
          Active
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <button className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-black">
          {saving ? "Saving..." : "Save changes"}
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
