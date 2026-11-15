"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string; disabled?: boolean; hint?: string };

type SegmentedProps<T extends string> = {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/** Segmented control = a native radio group (arrow keys, one tab stop) styled as pixel buttons. */
export function Segmented<T extends string>({ legend, value, options, onChange, className }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="mb-1 font-semibold">{legend}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={o.value} className="segmented__option" data-disabled={o.disabled ? "" : undefined} title={o.hint}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
