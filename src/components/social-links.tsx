import { Instagram, Linkedin, Youtube } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const ICONS = {
  YouTube: Youtube,
  Instagram: Instagram,
  LinkedIn: Linkedin,
} as const;

export function SocialLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Cloud Vaathi on social media" className={cn("flex items-center gap-2.5", className)}>
      {SOCIAL_LINKS.map(({ name, href }) => {
        const Icon = ICONS[name];
        return (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} (opens in a new tab)`}
            title={name}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 hover:text-primary"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        );
      })}
    </nav>
  );
}
