import { useRouterState } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

function disableBrowserScrollMemory() {
  if (typeof window === "undefined") return;
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
}

function scrollToHead() {
  if (typeof window === "undefined") return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return false;
  const el = document.getElementById(decodeURIComponent(id));
  if (!el) return false;
  el.scrollIntoView({ behavior: "instant", block: "start" });
  return true;
}

/**
 * New visits and path changes start at the top.
 * Hash links (`/#upcoming`, `/about#founder`) scroll to that section instead.
 */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  useLayoutEffect(() => {
    disableBrowserScrollMemory();

    const run = () => {
      if (hash && scrollToHash(hash)) return;
      if (!hash) scrollToHead();
    };

    run();
    const frame = window.requestAnimationFrame(run);
    const t0 = window.setTimeout(run, 0);
    const t1 = window.setTimeout(run, 80);
    const t2 = window.setTimeout(run, 250);

    const onLoad = () => run();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) run();
    };

    window.addEventListener("load", onLoad);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, hash]);

  return null;
}
