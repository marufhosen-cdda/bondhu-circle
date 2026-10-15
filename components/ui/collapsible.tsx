"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export const CollapsibleContent = CollapsiblePrimitive.Content;

/** Accessible accordion-style disclosure used by the FAQ. */
export function Disclosure({
  question,
  answer,
  className,
}: {
  question: string;
  answer: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("border-b border-border", className)}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-colors hover:text-primary sm:text-base"
        >
          {question}
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
