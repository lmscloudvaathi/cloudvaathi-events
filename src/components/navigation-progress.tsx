import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

function locationHref(loc: { href: string }): string {
  return loc.href;
}

/**
 * Top-of-viewport progress during navigations.
 * Subscribes to `onResolved` so every successful URL change (including cached loaders)
 * triggers a short pulse, in addition to `isLoading` / `isTransitioning`.
 */
export function NavigationProgress() {
  const router = useRouter();
  const routerBusy = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });

  const [navPulse, setNavPulse] = useState(false);
  const prevHref = useRef<string | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    prevHref.current = locationHref(router.state.location);

    const unsub = router.subscribe("onResolved", (evt) => {
      const next = locationHref(evt.toLocation);
      if (prevHref.current === next) return;
      prevHref.current = next;

      window.clearTimeout(pulseTimer.current);
      setNavPulse(true);
      pulseTimer.current = window.setTimeout(() => {
        setNavPulse(false);
        pulseTimer.current = undefined;
      }, 400);
    });

    return () => {
      unsub();
      window.clearTimeout(pulseTimer.current);
    };
  }, [router]);

  const busy = routerBusy || navPulse;
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (busy) {
      window.clearTimeout(hideTimer.current);
      showTimer.current = window.setTimeout(() => setVisible(true), 30);
    } else {
      window.clearTimeout(showTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 90);
    }
    return () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
    };
  }, [busy]);

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!visible}
      >
        <div className="nav-progress-bar h-full w-[45%] max-w-md rounded-full bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent shadow-[0_0_12px_var(--neon-cyan)]" />
      </div>
      {visible ? (
        <span className="sr-only" role="status">
          Loading page
        </span>
      ) : null}
    </>
  );
}
