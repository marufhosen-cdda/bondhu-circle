import * as React from "react";

import { cn } from "@/lib/utils";

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Styled native `<select>`.
 *
 * Deliberately not a Radix select: on mobile this gives us the platform
 * picker for free, which is both faster and more accessible.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-input bg-card px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      >
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";
