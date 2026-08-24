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

/**
 * Every new visit and every refresh starts at the top of the page.
 * In-page hash links (same pathname) still jump to their section.
 */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useLayoutEffect(() => {
    disableBrowserScrollMemory();
    scrollToHead();

    const onLoad = () => scrollToHead();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) scrollToHead();
    };

    window.addEventListener("load", onLoad);
    window.addEventListener("pageshow", onPageShow);
    const frame = window.requestAnimationFrame(scrollToHead);
    const timeout = window.setTimeout(scrollToHead, 0);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}
