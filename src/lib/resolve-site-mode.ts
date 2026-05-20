import { createIsomorphicFn } from "@tanstack/react-start";
import { modeFromHost, modeFromLocalPort, type SiteMode } from "./site-mode-shared";

function siteModeFromBuildEnv(): SiteMode {
  const fromEnv = import.meta.env.VITE_SITE_MODE;
  if (fromEnv === "marketing" || fromEnv === "events") return fromEnv;
  return "events";
}

function resolveFromUrl(url: URL): SiteMode | null {
  const fromHost = modeFromHost(url.hostname);
  if (fromHost) return fromHost;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return modeFromLocalPort(url.port);
  }
  return null;
}

/**
 * Resolves marketing vs events surface from hostname (production) or dev port (localhost).
 */
export const resolveSiteMode = createIsomorphicFn()
  .client((): SiteMode => {
    if (typeof window !== "undefined") {
      const resolved = resolveFromUrl(new URL(window.location.href));
      if (resolved) return resolved;
    }
    return siteModeFromBuildEnv();
  })
  .server(async (): Promise<SiteMode> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const resolved = resolveFromUrl(new URL(request.url));
    if (resolved) return resolved;
    return siteModeFromBuildEnv();
  });
