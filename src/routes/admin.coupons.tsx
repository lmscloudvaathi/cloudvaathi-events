import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatINR } from "@/lib/mock-data";
import {
  adminCouponsFn,
  adminCoursesFn,
  adminCreateCouponFn,
  adminEventsFn,
  adminSetCouponActiveFn,
  adminUpdateCouponFn,
} from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

type ScopeRow = { item_type: "course" | "event"; item_slug: string; title?: string };

type ProgramOption = {
  key: string;
  item_type: "course" | "event";
  item_slug: string;
  title: string;
  active: boolean;
};

type CouponRow = {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  scopes: ScopeRow[];
};

function programKey(item_type: "course" | "event", item_slug: string) {
  return `${item_type}::${item_slug}`;
}

function parseProgramKey(value: string): { item_type: "course" | "event"; item_slug: string } | null {
  const idx = value.indexOf("::");
  if (idx <= 0) return null;
  const item_type = value.slice(0, idx);
  const item_slug = value.slice(idx + 2);
  if ((item_type !== "course" && item_type !== "event") || !item_slug) return null;
  return { item_type, item_slug };
}

function normalizeTitleKey(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Prefer clean slugs (kebab/underscore) over title-as-slug duplicates. */
function slugRank(slug: string) {
  const s = slug.trim();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(s)) return 0;
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(s)) return 1;
  return 2;
}

/** Active programs only, unique by type+slug and by type+title (so coupons target one clear program). */
function uniqueProgramsForCoupons(rows: ProgramOption[]): ProgramOption[] {
  const bySlug = new Map<string, ProgramOption>();
  for (const row of rows) {
    const slugKey = `${row.item_type}::${row.item_slug.trim().toLowerCase()}`;
    const prev = bySlug.get(slugKey);
    if (!prev || slugRank(row.item_slug) < slugRank(prev.item_slug)) {
      bySlug.set(slugKey, row);
    }
  }

  const byTitle = new Map<string, ProgramOption>();
  const slugSorted = [...bySlug.values()].sort((a, b) => {
    const rank = slugRank(a.item_slug) - slugRank(b.item_slug);
    if (rank !== 0) return rank;
    return a.item_slug.localeCompare(b.item_slug, "en");
  });
  for (const row of slugSorted) {
    const titleKey = `${row.item_type}::${normalizeTitleKey(row.title)}`;
    if (!byTitle.has(titleKey)) byTitle.set(titleKey, row);
  }

  return [...byTitle.values()].sort((a, b) => a.title.localeCompare(b.title, "en"));
}

function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: 10,
    max_uses: "" as string,
    valid_from: "",
    valid_until: "",
    scopes: [{ item_type: "course" as const, item_slug: "" }],
  });
  const [msg, setMsg] = useState("");

  const programOptions = useMemo(() => uniqueProgramsForCoupons(programs), [programs]);

  const load = () => {
    const token = getSessionToken();
    if (!token) {
      setMsg("Sign in as admin to manage coupons.");
      return;
    }
    adminCouponsFn({ data: { token } })
      .then(setCoupons)
      .catch((err) => {
        setMsg(err instanceof Error ? err.message : "Could not load coupons.");
      });
    Promise.all([adminCoursesFn({ data: { token } }), adminEventsFn({ data: { token } })])
      .then(([courses, events]) => {
        setPrograms([
          ...courses
            .filter((r) => Number(r.active) === 1)
            .map((r) => ({
              key: programKey("course", r.slug),
              item_type: "course" as const,
              item_slug: r.slug,
              title: r.title,
              active: true,
            })),
          ...events
            .filter((r) => Number(r.active) === 1)
            .map((r) => ({
              key: programKey("event", r.slug),
              item_type: "event" as const,
              item_slug: r.slug,
              title: r.title,
              active: true,
            })),
        ]);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      code: "",
      description: "",
      discount_type: "percent",
      discount_value: 10,
      max_uses: "",
      valid_from: "",
      valid_until: "",
      scopes: [{ item_type: "course", item_slug: "" }],
    });
  }

  function startEdit(c: CouponRow) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      valid_from: c.valid_from ?? "",
      valid_until: c.valid_until ?? "",
      scopes: c.scopes.length
        ? c.scopes.map((s) => ({ item_type: s.item_type, item_slug: s.item_slug }))
        : [{ item_type: "course", item_slug: "" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const token = getSessionToken();
    if (!token) return;
    const scopes = form.scopes.filter((s) => s.item_slug.trim());
    if (!scopes.length) {
      setMsg("Add at least one course or event.");
      return;
    }
    const maxUses =
      form.max_uses.trim() === "" ? null : Math.max(1, parseInt(form.max_uses, 10) || 1);
    try {
      if (editingId != null) {
        await adminUpdateCouponFn({
          data: {
            token,
            id: editingId,
            description: form.description.trim() || undefined,
            discount_type: form.discount_type,
            discount_value: form.discount_value,
            max_uses: maxUses,
            valid_from: form.valid_from.trim() || null,
            valid_until: form.valid_until.trim() || null,
            scopes,
          },
        });
        setMsg("Coupon updated.");
      } else {
        await adminCreateCouponFn({
          data: {
            token,
            code: form.code.trim(),
            description: form.description.trim() || undefined,
            discount_type: form.discount_type,
            discount_value: form.discount_value,
            max_uses: maxUses,
            valid_from: form.valid_from.trim() || null,
            valid_until: form.valid_until.trim() || null,
            scopes,
          },
        });
        setMsg("Coupon created.");
        resetForm();
      }
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// pricing</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Coupons</h1>
        <p className="mt-1 text-muted-foreground">
          Create codes for specific programs. A code only works on the programs you select. Coupons stop working when a
          program is unpublished, registration closes, or the program ends — in addition to the coupon&apos;s own dates.
        </p>
      </header>

      <form className="space-y-4 rounded-2xl glass p-6" onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{editingId != null ? `Edit coupon #${editingId}` : "New coupon"}</p>
          {editingId != null ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => {
                resetForm();
                setMsg("");
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
        {editingId == null ? (
          <label className="block space-y-1 max-w-md">
            <span className="text-xs font-medium text-muted-foreground">Code (letters & numbers)</span>
            <input
              required
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm uppercase"
              placeholder="EARLYBIRD20"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            Code <span className="font-mono font-semibold text-foreground">{form.code}</span> cannot be changed after
            creation.
          </p>
        )}
        <label className="block space-y-1 max-w-xl">
          <span className="text-xs font-medium text-muted-foreground">Description (optional)</span>
          <input
            className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
            placeholder="Launch cohort — 20% off"
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Discount type</span>
            <select
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
              value={form.discount_type}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  discount_type: e.target.value as "percent" | "fixed",
                }))
              }
            >
              <option value="percent">Percent off list price</option>
              <option value="fixed">Fixed amount off (INR)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              {form.discount_type === "percent" ? "Percent (1–100)" : "Rupees off"}
            </span>
            <input
              required
              type="number"
              min={1}
              max={form.discount_type === "percent" ? 100 : undefined}
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
              value={form.discount_value}
              onChange={(e) => setForm((s) => ({ ...s, discount_value: Number(e.target.value) }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Max uses (blank = unlimited)</span>
            <input
              type="number"
              min={1}
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
              placeholder="∞"
              value={form.max_uses}
              onChange={(e) => setForm((s) => ({ ...s, max_uses: e.target.value }))}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Valid from (optional)</span>
            <input
              type="date"
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
              value={form.valid_from}
              onChange={(e) => setForm((s) => ({ ...s, valid_from: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Valid until (optional)</span>
            <input
              type="date"
              className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
              value={form.valid_until}
              onChange={(e) => setForm((s) => ({ ...s, valid_until: e.target.value }))}
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Applies to (unique active programs — each can be selected once)
          </p>
          {form.scopes.map((row, i) => {
            const currentKey = row.item_slug ? programKey(row.item_type, row.item_slug) : "";
            const selectedElsewhere = new Set(
              form.scopes
                .map((s, j) =>
                  j !== i && s.item_slug
                    ? `${s.item_type}::${s.item_slug.trim().toLowerCase()}`
                    : "",
                )
                .filter(Boolean),
            );
            const optionsForRow = programOptions.filter((o) => {
              const k = `${o.item_type}::${o.item_slug.trim().toLowerCase()}`;
              return o.key === currentKey || !selectedElsewhere.has(k);
            });
            // Keep current selection visible even if it was deduped from the master list.
            const currentOption =
              currentKey && !optionsForRow.some((o) => o.key === currentKey)
                ? programs.find((p) => p.key === currentKey)
                : null;
            const dropdownOptions = currentOption
              ? [currentOption, ...optionsForRow]
              : optionsForRow;

            return (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <label className="min-w-[240px] flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Program</span>
                <select
                  required
                  className="w-full rounded border bg-input/40 px-2 py-1.5 text-sm"
                  value={currentKey}
                  onChange={(e) => {
                    const parsed = parseProgramKey(e.target.value);
                    const next = [...form.scopes];
                    next[i] = parsed
                      ? { item_type: parsed.item_type, item_slug: parsed.item_slug }
                      : { item_type: "course", item_slug: "" };
                    setForm((s) => ({ ...s, scopes: next }));
                  }}
                >
                  <option value="">Select program…</option>
                  {dropdownOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.title} — {o.item_type === "course" ? "Course" : "Event"} [{o.item_slug}]
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary/60"
                onClick={() => {
                  const next = form.scopes.filter((_, j) => j !== i);
                  setForm((s) => ({
                    ...s,
                    scopes: next.length ? next : [{ item_type: "course", item_slug: "" }],
                  }));
                }}
              >
                Remove
              </button>
            </div>
            );
          })}
          <button
            type="button"
            className="text-xs font-semibold text-neon-cyan hover:underline"
            onClick={() =>
              setForm((s) => ({
                ...s,
                scopes: [...s.scopes, { item_type: "course", item_slug: "" }],
              }))
            }
          >
            + Add program
          </button>
        </div>

        {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="submit" className="rounded bg-gradient-neon px-4 py-2 text-xs font-semibold text-primary-foreground">
            {editingId != null ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl glass overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase text-muted-foreground">
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Applies to</th>
              <th className="p-3">Uses</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border/40">
                <td className="p-3 font-mono text-xs font-semibold">{c.code}</td>
                <td className="p-3">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : formatINR(c.discount_value)} off list
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {c.scopes.length ? (
                    <ul className="space-y-1">
                      {c.scopes.map((s) => (
                        <li key={`${s.item_type}:${s.item_slug}`}>
                          <span className="font-medium text-foreground">{s.title || s.item_slug}</span>
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                            ({s.item_type === "course" ? "Course" : "Event"})
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground/80">
                            {s.item_slug}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-xs">
                  {c.uses_count}
                  {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="p-3">{c.active ? "Yes" : "No"}</td>
                <td className="p-3 space-x-2">
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={async () => {
                      const token = getSessionToken();
                      if (!token) return;
                      await adminSetCouponActiveFn({ data: { token, id: c.id, active: !c.active } });
                      load();
                    }}
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">No coupons yet.</p> : null}
      </div>
    </div>
  );
}
