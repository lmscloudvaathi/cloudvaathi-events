import { Link } from "@tanstack/react-router";
import { Cloud, Github, Linkedin, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border/50 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-neon">
              <Cloud className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold">Cloud Vaathi</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A community-led academy for cloud, DevOps and platform engineers. Live cohorts, real projects and a network that ships.
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
            <li><Link to="/courses" className="hover:text-primary">Courses</Link></li>
            <li><Link to="/events" className="hover:text-primary">Events</Link></li>
            <li><Link to="/login" className="hover:text-primary">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>hello@cloudvaathi.dev</li>
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
