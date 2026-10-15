import type { LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/motion";

/**
 * Friendly empty state: illustration + explanation + CTA.
 *
 * The illustration is a hand-drawn inline SVG kept in one place so every empty
 * state looks consistent (see the README's note on illustration sourcing).
 */
export function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  text?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <FadeUp className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <EmptyIllustration />

      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      {text ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{text}</p> : null}

      {Icon ? <Icon className="mt-4 size-5 text-primary" aria-hidden /> : null}

      {actionLabel && actionHref ? (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}

      {children}
    </FadeUp>
  );
}

/** Two friends on a park bench under a tree — reused by every empty state. */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      role="img"
      aria-hidden="true"
      className={className ?? "h-28 w-44 text-primary"}
    >
      <rect x="0" y="0" width="200" height="120" rx="16" fill="currentColor" opacity="0.06" />
      {/* tree */}
      <path
        d="M158 92V64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="158" cy="52" r="16" fill="currentColor" opacity="0.25" />
      <circle cx="146" cy="60" r="11" fill="currentColor" opacity="0.18" />
      <circle cx="170" cy="61" r="10" fill="currentColor" opacity="0.18" />
      {/* bench */}
      <path
        d="M44 92h84M48 92v-8h76v8M56 84V74m60 10V74"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* two friends */}
      <circle cx="76" cy="58" r="8" fill="currentColor" opacity="0.7" />
      <path
        d="M66 84c0-8 4-14 10-14s10 6 10 14"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="104" cy="60" r="8" fill="currentColor" opacity="0.7" />
      <path
        d="M94 84c0-8 4-13 10-13s10 5 10 13"
        fill="currentColor"
        opacity="0.55"
      />
      {/* ground */}
      <path
        d="M20 100h160"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}
