import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  children: ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────

export function PageLayout({ header, children, className, ...props }: PageLayoutProps) {
  return (
    <div
      className={cn("min-h-dvh bg-[var(--color-bg)]", className)}
      {...props}
    >
      {header && (
        <header className="sticky top-0 z-50 w-full bg-[var(--color-surface)] border-b border-[var(--color-surface-border)]">
          <div
            className="mx-auto w-full px-[var(--spacing-md)] md:px-[var(--spacing-lg)]"
            style={{ maxWidth: "var(--max-content-width)" }}
          >
            {header}
          </div>
        </header>
      )}

      <main>
        <div
          className="mx-auto w-full px-[var(--spacing-md)] py-[var(--spacing-lg)] md:px-[var(--spacing-lg)] md:py-[var(--spacing-xl)]"
          style={{ maxWidth: "var(--max-content-width)" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
