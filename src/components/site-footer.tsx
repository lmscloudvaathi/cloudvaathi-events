import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { JumpLink } from "@/components/jump-link";
import { SocialLinks } from "@/components/social-links";
import { CONTACT_EMAIL } from "@/lib/site-config";
import { eventsHref, marketingHref, useIsMarketingSite, useSiteMode } from "@/lib/site-mode";
import { lmsSiteUrl } from "@/lib/site-mode-shared";
import { useSessionUser } from "@/hooks/use-session-user";

export function SiteFooter() {
  const { user } = useSessionUser();
  const marketing = useIsMarketingSite();
  const siteMode = useSiteMode();

  return (
    <footer className="mt-16 border-t border-border/50 bg-surface/40 sm:mt-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <BrandLogo size="sm" />
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A community-led academy for cloud, DevOps and platform engineers. Live cohorts, real projects and a network
            that ships.
          </p>
          <SocialLinks className="mt-5" />
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
                  <JumpLink href={eventsHref(siteMode, "/")} className="hover:text-primary">
                    Courses &amp; events
                  </JumpLink>
                </li>
                <li>
                  <JumpLink href={lmsSiteUrl()} newTab className="hover:text-primary">
                    LMS
                  </JumpLink>
                </li>
                <li>
                  <Link to="/about" className="hover:text-primary">
                    Meet Sivva
                  </Link>
                </li>
                <li>
                  <Link to="/testimonials" className="hover:text-primary">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/refund" className="hover:text-primary">
                    Refunds
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
                  <JumpLink href={marketingHref(siteMode, "/")} className="hover:text-primary">
                    Cloud Vaathi home
                  </JumpLink>
                </li>
                <li>
                  <JumpLink href={marketingHref(siteMode, "/about")} className="hover:text-primary">
                    Meet Sivva
                  </JumpLink>
                </li>
                <li>
                  <JumpLink href={lmsSiteUrl()} newTab className="hover:text-primary">
                    LMS
                  </JumpLink>
                </li>
                {!user ? (
                  <li>
                    <a href="/login" className="hover:text-primary">
                      Learner login
                    </a>
                  </li>
                ) : null}
                <li>
                  <Link to="/privacy" className="hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/refund" className="hover:text-primary">
                    Refunds
                  </Link>
                </li>
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
      <div className="border-t border-border/40 px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            © 2026 Cloud Vaathi. Learn deeply. Certify confidently. Transform your career.
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
