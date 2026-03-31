import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// ── Variant styles ─────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]",
  success:
    "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
  error:
    "bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] text-[var(--color-error)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)]",
  info:
    "bg-[color-mix(in_srgb,var(--color-info)_15%,transparent)] text-[var(--color-info)] border border-[color-mix(in_srgb,var(--color-info)_30%,transparent)]",
};

// ── Component ──────────────────────────────────────────────────────────────

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5",
        "text-[var(--text-micro)] font-medium font-[family-name:var(--font-body)]",
        "rounded-[var(--radius-full)]",
        "whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
