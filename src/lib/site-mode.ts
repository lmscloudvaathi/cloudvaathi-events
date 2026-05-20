import { useRouteContext } from "@tanstack/react-router";
import { modeFromHost, modeFromLocalPort, type SiteMode } from "./site-mode-shared";

export type { SiteMode } from "./site-mode-shared";
export {
  EVENTS_SITE_URL,
  LMS_SITE_URL,
  MARKETING_SITE_URL,
  eventsSiteUrl,
  lmsSiteUrl,
  marketingSiteUrl,
} from "./site-mode-shared";

/** Client fallback when route context is not ready yet. */
export function getSiteModeClientFallback(): SiteMode {
  if (typeof window !== "undefined") {
    const fromBrowser = modeFromHost(window.location.hostname);
    if (fromBrowser) return fromBrowser;
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      const fromPort = modeFromLocalPort(window.location.port);
      if (fromPort) return fromPort;
    }
  }
  return import.meta.env.VITE_SITE_MODE === "marketing" ? "marketing" : "events";
}

/** Prefer root route context (SSR-accurate); fall back to hostname on the client. */
export function useSiteMode(): SiteMode {
  const ctx = useRouteContext({ from: "__root__", strict: false }) as { siteMode?: SiteMode } | undefined;
  return ctx?.siteMode ?? getSiteModeClientFallback();
}

export function useIsMarketingSite(): boolean {
  return useSiteMode() === "marketing";
}

export function useIsEventsSite(): boolean {
  return useSiteMode() === "events";
}

/** @deprecated Use `useSiteMode()` in components or `resolveSiteMode()` in loaders. */
export function getSiteMode(): SiteMode {
  return getSiteModeClientFallback();
}

/** @deprecated Use `useIsMarketingSite()` in components. */
export function isMarketingSite(): boolean {
  return getSiteModeClientFallback() === "marketing";
}

/** @deprecated Use `useIsEventsSite()` in components. */
export function isEventsSite(): boolean {
  return getSiteModeClientFallback() === "events";
}
