import { BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE } from "@/lib/site-config";
import type { SiteMode } from "@/lib/site-mode-shared";
import { EVENTS_SITE_URL, MARKETING_SITE_URL } from "@/lib/site-mode-shared";

export const DEFAULT_SITE_DESCRIPTION =
  "Cloud Vaathi offers live cloud cohorts, certification prep, workshops, and tech events. Learn deeply. Certify confidently. Transform your career.";

export function siteBaseUrlForMode(siteMode: SiteMode): string {
  return siteMode === "marketing" ? MARKETING_SITE_URL : EVENTS_SITE_URL;
}

export type SocialMetaOptions = {
  siteBaseUrl: string;
  title?: string;
  description?: string;
  /** Path only, e.g. `/courses/foo` */
  path?: string;
  imagePath?: string;
};

/** Meta tags for link previews (WhatsApp, LinkedIn, Twitter, etc.). */
export function buildSocialMeta(options: SocialMetaOptions) {
  const title = options.title ?? `${BRAND_NAME} — ${BRAND_TAGLINE}`;
  const description = options.description ?? DEFAULT_SITE_DESCRIPTION;
  const base = options.siteBaseUrl.replace(/\/$/, "");
  const path = options.path
    ? options.path.startsWith("/")
      ? options.path
      : `/${options.path}`
    : "/";
  const url = `${base}${path}`;
  const image = `${base}${options.imagePath ?? BRAND_LOGO_PATH}`;

  return [
    { title },
    { name: "description", content: description },
    { name: "application-name", content: BRAND_NAME },
    { name: "author", content: BRAND_NAME },
    { property: "og:site_name", content: BRAND_NAME },
    { property: "og:locale", content: "en_IN" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: `${BRAND_NAME} — ${BRAND_TAGLINE}` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ] as const;
}
