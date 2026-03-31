import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "cyan";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

// ── Variant styles ─────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-air-temp)] text-white border border-[var(--color-air-temp)] hover:brightness-110 active:brightness-90",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-surface-border)] hover:bg-[var(--color-surface-hover)] active:brightness-90",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] border border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:brightness-90",
  cyan:
    "bg-[var(--color-water-temp)] text-[var(--color-bg)] border border-[var(--color-water-temp)] hover:brightness-110 active:brightness-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3 py-2 text-[var(--text-small)] gap-1.5",
  md: "min-h-[44px] px-4 py-2.5 text-[var(--text-body)] gap-2",
  lg: "min-h-[52px] px-6 py-3 text-[var(--text-h3)] gap-2.5",
};

// ── Component ──────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          // Base
          "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium",
          "font-[family-name:var(--font-body)]",
          "transition-all duration-[var(--duration-short)] ease-[var(--ease-move)]",
          "cursor-pointer select-none",
          // Focus
          "focus-visible:outline-2 focus-visible:outline-[var(--color-air-temp)] focus-visible:outline-offset-2",
          // Disabled
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          // Variant + Size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin shrink-0"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
            />
            <path
              d="M8 2a6 6 0 0 1 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
