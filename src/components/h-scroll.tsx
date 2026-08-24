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

/** Cards swipe horizontally on small screens; grid from `md` up. */
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
        "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [-webkit-overflow-scrolling:touch] sm:-mx-6 sm:px-6",
        hideScrollbar,
        "md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3",
        className,
      )}
    >
      {Children.map(children, (child) => (
        <div className="w-[min(82vw,22rem)] shrink-0 snap-start md:w-auto md:min-w-0 md:shrink">
          {child}
        </div>
      ))}
    </div>
  );
}
