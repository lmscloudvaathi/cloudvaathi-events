import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { SiteMode } from "./lib/site-mode-shared";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient, siteMode: "events" as SiteMode },
    scrollRestoration: true,
    // Keep route loader results warm briefly so moving between catalog pages does not constantly resuspend / refetch.
    defaultStaleTime: 60_000,
    // Avoid treating preloaded route data as instantly stale (reduces loader churn / flicker on navigation).
    defaultPreloadStaleTime: 30_000,
    /** Brief delay before showing `pendingComponent` — reduces flash on fast loaders. */
    defaultPendingMs: 50,
    /** Minimum time pending UI stays visible — feels deliberate, not glitchy. */
    defaultPendingMinMs: 180,
  });

  return router;
};
