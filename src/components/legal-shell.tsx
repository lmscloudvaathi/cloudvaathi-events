import { Link } from "@tanstack/react-router";
import { AuroraBg } from "@/components/aurora-bg";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AuroraBg />
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Home
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </article>
      <SiteFooter />
    </div>
  );
}
