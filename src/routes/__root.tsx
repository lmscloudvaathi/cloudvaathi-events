import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { FAVICON_PATH } from "@/lib/site-config";
import { buildSocialMeta, siteBaseUrlForMode } from "@/lib/site-meta";
import { NavigationProgress } from "@/components/navigation-progress";
import { ScrollToTop } from "@/components/scroll-to-top";
import { enforceSiteAccess } from "@/lib/site-guards";
import { resolveSiteMode } from "@/lib/resolve-site-mode";
import type { SiteMode } from "@/lib/site-mode-shared";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/** Load after hydration — checkout.js injects `.razorpay-container` into the DOM and breaks SSR match if loaded in <head>. */
function RazorpayCheckoutScript() {
  useEffect(() => {
    if (document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const showDevDetail = import.meta.env.DEV;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {showDevDetail ? (
          <pre className="mt-4 max-h-[40vh] overflow-auto rounded-md bg-muted p-3 text-left text-xs whitespace-pre-wrap break-words">
            {error.stack ?? error.message}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  siteMode: SiteMode;
}>()({
  beforeLoad: async ({ location }) => {
    const siteMode = await resolveSiteMode();
    enforceSiteAccess(location.pathname, siteMode);
    return { siteMode };
  },
  head: ({ match }) => {
    const siteMode = match.context.siteMode ?? "events";
    const siteBaseUrl = siteBaseUrlForMode(siteMode);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...buildSocialMeta({ siteBaseUrl }),
      ],
      links: [
        {
          rel: "icon",
          href: FAVICON_PATH,
          type: "image/png",
        },
        {
          rel: "apple-touch-icon",
          href: FAVICON_PATH,
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RazorpayCheckoutScript />
      <ScrollToTop />
      <NavigationProgress />
      <Outlet />
    </QueryClientProvider>
  );
}
