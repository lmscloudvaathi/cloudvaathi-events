import { Link } from "@tanstack/react-router";
import { Github, Linkedin, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { eventsSiteUrl, lmsSiteUrl, marketingSiteUrl } from "@/lib/site-mode-shared";
import { useIsMarketingSite } from "@/lib/site-mode";
import { useSessionUser } from "@/hooks/use-session-user";

export function SiteFooter() {
  const { user } = useSessionUser();
  const marketing = useIsMarketingSite();

  return (
    <footer className="mt-32 border-t border-border/50 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandLogo size="sm" />
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A community-led academy for cloud, DevOps and platform engineers. Live cohorts, real projects and a network
            that ships.
          </p>
          <div className="mt-5 flex gap-3">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground hover:border-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {marketing ? (
              <>
                <li>
                  <Link to="/" className="hover:text-primary">
                    Home
                  </Link>
                </li>
                <li>
                  <a href={eventsSiteUrl("/")} className="hover:text-primary">
                    Courses &amp; events
                  </a>
                </li>
                <li>
                  <a href={lmsSiteUrl()} className="hover:text-primary">
                    LMS
                  </a>
                </li>
                <li>
                  <Link to="/testimonials" className="hover:text-primary">
                    Testimonials
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/" className="hover:text-primary">
                    Courses &amp; events
                  </Link>
                </li>
                <li>
                  <a href={marketingSiteUrl("/")} className="hover:text-primary">
                    Cloud Vaathi home
                  </a>
                </li>
                <li>
                  <a href={lmsSiteUrl()} className="hover:text-primary">
                    LMS
                  </a>
                </li>
                {!user ? (
                  <li>
                    <Link to="/login" className="hover:text-primary">
                      Sign in
                    </Link>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>Chennai · Bengaluru</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 px-4 py-5 text-center text-xs text-muted-foreground">
        © 2026 Cloud Vaathi. Built for the cloud generation.
      </div>
    </footer>
  );
}
