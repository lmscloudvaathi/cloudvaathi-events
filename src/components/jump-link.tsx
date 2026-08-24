import type { AnchorHTMLAttributes, MouseEvent } from "react";

function isSpecialHref(href: string) {
  return /^(mailto:|tel:|javascript:)/i.test(href);
}

/**
 * Cross-site and hash links. TanStack Router intercepts same-origin `<a>` clicks
 * and ScrollToTop was wiping hashes — this forces a real jump.
 */
export function JumpLink({
  href,
  newTab = false,
  onClick,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; newTab?: boolean }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isSpecialHref(href)) return;

    const url = new URL(href, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    const samePath = url.pathname === window.location.pathname;

    if (newTab) {
      event.preventDefault();
      window.open(url.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (!sameOrigin) {
      event.preventDefault();
      window.location.assign(url.href);
      return;
    }

    if (url.hash) {
      event.preventDefault();
      const id = decodeURIComponent(url.hash.slice(1));
      if (!samePath) {
        window.location.assign(`${url.pathname}${url.search}${url.hash}`);
        return;
      }
      window.history.pushState(null, "", `${url.search}${url.hash}`);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
