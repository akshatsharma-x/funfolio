"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visible state words (default ON / OFF). */
  onText?: string;
  offText?: string;
  className?: string;
};

/** Accessible on/off switch (role="switch"), pixel style. */
export function Switch({ label, checked, onChange, onText = "On", offText = "Off", className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span id={id} className="font-semibold">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        className="pixel-switch"
        data-on={checked ? "" : undefined}
        onClick={() => onChange(!checked)}
      >
        <span className="pixel-switch__knob" aria-hidden="true" />
        <span className="pixel-switch__text">{checked ? onText : offText}</span>
      </button>
    </div>
  );
}
