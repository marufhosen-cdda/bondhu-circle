import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths under a locale. Calling notFound() routes the
 * request to app/[locale]/not-found.tsx while keeping the locale intact.
 */
export default function CatchAllPage() {
  notFound();
}
