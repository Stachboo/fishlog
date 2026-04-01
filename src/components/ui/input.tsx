import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-[var(--spacing-xs)]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[var(--text-small)] font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            // Layout & sizing
            "w-full min-h-[44px] px-[var(--spacing-md)] py-[var(--spacing-sm)]",
            // Typography
            "text-[var(--text-body)] font-[family-name:var(--font-body)]",
            "text-[var(--color-text-primary)]",
            "placeholder:text-[var(--color-text-muted)]",
            // Appearance
            "bg-[var(--color-bg)] border border-[var(--color-surface-border)]",
            "rounded-[var(--radius-md)]",
            // Focus
            "transition-colors",
            "focus:outline-none focus:border-[var(--color-water-temp)]",
            "focus:ring-1 focus:ring-[var(--color-water-temp)]",
            // Error state
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-[var(--text-micro)] text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-[var(--text-micro)] text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
