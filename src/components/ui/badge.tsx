import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// ── Variant styles ─────────────────────────────────────────────────────────

const variantConfig: Record<BadgeVariant, { color: string; className: string }> = {
  default: {
    color: "",
    className: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-surface-border)]",
  },
  success: {
    color: "var(--color-success)",
    className: "text-[var(--color-success)]",
  },
  warning: {
    color: "var(--color-warning)",
    className: "text-[var(--color-warning)]",
  },
  error: {
    color: "var(--color-error)",
    className: "text-[var(--color-error)]",
  },
  info: {
    color: "var(--color-info)",
    className: "text-[var(--color-info)]",
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const { color, className: variantClass } = variantConfig[variant];
  const needsColorMix = variant !== "default" && color;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5",
        "text-[var(--text-micro)] font-medium font-[family-name:var(--font-body)]",
        "rounded-[var(--radius-full)]",
        "whitespace-nowrap border",
        variantClass,
        className
      )}
      style={needsColorMix ? {
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      } : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
