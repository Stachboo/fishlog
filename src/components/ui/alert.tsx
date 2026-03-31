import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  message: string;
  icon?: ReactNode;
  onDismiss?: () => void;
}

// ── Variant config ─────────────────────────────────────────────────────────

const variantConfig: Record<
  AlertVariant,
  { borderColor: string; bgColor: string; textColor: string; defaultIcon: ReactNode }
> = {
  success: {
    borderColor: "var(--color-success)",
    bgColor: "color-mix(in srgb, var(--color-success) 8%, transparent)",
    textColor: "var(--color-success)",
    defaultIcon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  warning: {
    borderColor: "var(--color-warning)",
    bgColor: "color-mix(in srgb, var(--color-warning) 8%, transparent)",
    textColor: "var(--color-warning)",
    defaultIcon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  error: {
    borderColor: "var(--color-error)",
    bgColor: "color-mix(in srgb, var(--color-error) 8%, transparent)",
    textColor: "var(--color-error)",
    defaultIcon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    borderColor: "var(--color-info)",
    bgColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
    textColor: "var(--color-info)",
    defaultIcon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export function Alert({
  variant = "info",
  message,
  icon,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const config = variantConfig[variant];
  const displayIcon = icon ?? config.defaultIcon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-[var(--spacing-sm)] p-[var(--spacing-md)]",
        "rounded-[var(--radius-md)]",
        "border-l-4",
        className
      )}
      style={{
        borderLeftColor: config.borderColor,
        backgroundColor: config.bgColor,
        borderTopColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "transparent",
      }}
      {...props}
    >
      {/* Icon */}
      <span
        className="shrink-0 mt-[1px]"
        style={{ color: config.textColor }}
        aria-hidden="true"
      >
        {displayIcon}
      </span>

      {/* Message */}
      <p
        className="flex-1 text-[var(--text-small)] text-[var(--color-text-primary)] leading-snug"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {message}
      </p>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fermer l'alerte"
          className={cn(
            "shrink-0 ml-auto -mt-0.5 -mr-1",
            "p-1 rounded-[var(--radius-sm)]",
            "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            "transition-colors duration-[var(--duration-short)]",
            "cursor-pointer"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
