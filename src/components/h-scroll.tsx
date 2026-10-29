import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Single-row chip/tab strip that swipes on mobile instead of wrapping. */
export function ChipScroll({
  children,
  className,
  "aria-label": ariaLabel,
  role,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  role?: string;
}) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]",
        hideScrollbar,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Horizontal card strip that scrolls sideways at every breakpoint. */
export function CardScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [-webkit-overflow-scrolling:touch] sm:-mx-6 sm:px-6 md:mx-0 md:px-0",
        hideScrollbar,
        className,
      )}
    >
      {Children.map(children, (child) => (
        <div className="w-[min(82vw,22rem)] shrink-0 snap-start">
          {child}
        </div>
      ))}
    </div>
  );
}
