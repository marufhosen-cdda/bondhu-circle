import { createNavigation } from "next-intl/navigation";

import { routing } from "@/i18n/routing";

/**
 * Locale-aware navigation helpers. Always use these instead of next/link and
 * next/navigation inside the app so links keep the /en or /bn prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
