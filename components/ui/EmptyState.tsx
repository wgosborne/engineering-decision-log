// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
// Purpose: Display when no data/results found
// Shows icon, title, description, and optional CTA
// ============================================================================

import { LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gray-100">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-600 mb-6">{description}</p>
      )}

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
