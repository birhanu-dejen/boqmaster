"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-sm bg-transparent px-1.5 py-1 text-xs outline-none transition-colors " +
  "hover:bg-muted focus:bg-background focus:ring-2 focus:ring-primary/40";

/** Click-to-edit text cell. Enter or blur commits, Escape reverts. */
export function TextCell({
  value,
  onCommit,
  className,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false;
          setDraft(value);
          return;
        }
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(base, className)}
    />
  );
}

/** Click-to-edit number cell. Accepts "1,234.50"; invalid input reverts. */
export function NumberCell({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const cancelled = useRef(false);
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false;
          setDraft(String(value));
          return;
        }
        const n = parseFloat(draft.replace(/,/g, ""));
        if (Number.isFinite(n) && n >= 0) onCommit(n);
        else setDraft(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(base, "text-right tabular-nums", className)}
    />
  );
}
