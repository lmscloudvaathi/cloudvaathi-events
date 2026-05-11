import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuroraBg } from "@/components/aurora-bg";
import { RoutePendingFallback } from "@/components/route-pending-fallback";
import { formatINR } from "@/lib/mock-data";
import { myEnrollmentsFn } from "@/lib/rpc";
import { getSessionToken } from "@/lib/session-client";

export const Route = createFileRoute("/my-registrations")({
  head: () => ({
    meta: [{ title: "My registrations — Cloud Vaathi" }, { name: "robots", content: "noindex" }],
  }),
  component: MyRegistrationsPage,
});

type Row = {
  item_type: "course" | "event";
  item_slug: string;
  payment_status: "Paid" | "Pending" | "Refunded";
  amount: number;
  registered_at: string;
  title: string | null;
};

function MyRegistrationsPage() {
  const [status, setStatus] = useState<"loading" | "guest" | "ready">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setStatus("guest");
      return;
    }
    myEnrollmentsFn({ data: { token } })
      .then((data) => {
        setRows(data);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setStatus("ready");
      });
  }, []);

  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-cyan">// account</p>
        <h1 className="mt-3 font-display text-4xl font-bold">My registrations</h1>
        <p className="mt-2 text-muted-foreground">Courses and events you have enrolled in.</p>

        {status === "guest" ? (
          <div className="mt-10 rounded-2xl glass p-8 text-center">
            <p className="text-muted-foreground">Sign in to view your registrations.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                search={{ redirect: "/my-registrations" }}
                className="rounded-lg bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-black"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                search={{ redirect: "/my-registrations" }}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="mt-10">
            <RoutePendingFallback compact />
          </div>
        ) : null}

        {error ? <p className="mt-10 text-sm text-destructive">{error}</p> : null}

        {status === "ready" && rows.length === 0 && !error ? (
          <p className="mt-10 text-muted-foreground">You have not registered for anything yet.</p>
        ) : null}

        {status === "ready" && rows.length > 0 ? (
          <ul className="mt-10 space-y-4">
            {rows.map((r) => (
              <li key={`${r.item_type}-${r.item_slug}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl glass p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-secondary/60 p-2">
                    {r.item_type === "course" ? (
                      <GraduationCap className="h-5 w-5 text-neon-cyan" />
                    ) : (
                      <Calendar className="h-5 w-5 text-neon-cyan" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.item_type}</p>
                    <p className="font-semibold">{r.title ?? r.item_slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.registered_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase ${
                      r.payment_status === "Paid"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : r.payment_status === "Pending"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.payment_status}
                  </span>
                  <p className="mt-2 font-display text-lg font-bold text-gradient-neon">{formatINR(r.amount)}</p>
                  <Link
                    to={r.item_type === "course" ? "/courses/$slug" : "/events/$slug"}
                    params={{ slug: r.item_slug }}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    View details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <SiteFooter />
    </div>
  );
}
