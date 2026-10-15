"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Restrained motion primitives.
 *
 * Every wrapper respects `prefers-reduced-motion`: when a user asks for less
 * motion, content renders instantly instead of animating.
 */

type FadeUpProps = HTMLMotionProps<"div"> & {
  /** Seconds of delay, used for staggered lists. */
  delay?: number;
};

export function FadeUp({ delay = 0, className, ...props }: FadeUpProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    />
  );
}

/** Page-level wrapper: one soft fade-up per route. */
export function PageTransition({ className, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    />
  );
}

export function Stagger({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? "hidden" : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    />
  );
}

/** Springy press feedback for primary buttons. */
export function Pressable({ className, ...props }: HTMLMotionProps<"button">) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      whileTap={reduce ? undefined : { scale: 0.97 }}
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={className}
      {...props}
    />
  );
}

/**
 * Card → detail transition helper. Put the same `layoutId` on the list card
 * and the detail header so the eye can follow the element across routes.
 */
export function LayoutCard({ id, className, ...props }: HTMLMotionProps<"div"> & { id: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      layoutId={reduce ? undefined : id}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={cn(className)}
      {...props}
    />
  );
}
