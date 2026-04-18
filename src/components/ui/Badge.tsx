import React from "react";

type BadgeVariant =
  | "planning"
  | "workshop"
  | "offshore"
  | "invoicing"
  | "completed"
  | "standby"
  | "default";

const variantClasses: Record<BadgeVariant, string> = {
  planning: "bg-status-planning/15 text-status-planning",
  workshop: "bg-status-workshop/15 text-status-workshop",
  offshore: "bg-status-offshore/15 text-status-offshore",
  invoicing: "bg-status-invoicing/15 text-status-invoicing",
  completed: "bg-status-completed/15 text-status-completed",
  standby: "bg-status-standby/15 text-status-standby",
  default: "bg-warm-sand text-charcoal",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
