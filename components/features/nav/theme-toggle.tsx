"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

/**
 * Light/dark toggle.
 *
 * The theme itself lives in the `dark` class on `<html>` (written before paint
 * by an inline script in the root layout) and in localStorage. We read it
 * through `useSyncExternalStore` rather than mirroring it into state inside an
 * effect: no cascading render, and the server snapshot stays "light".
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const serverTheme = () => "light" as Theme;

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  const isDark = theme === "dark";

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("bondhu-theme", next);
    emit();
  }, []);

  return (
    <Button
      variant="ghost"
      size="iconSm"
      className={className}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
