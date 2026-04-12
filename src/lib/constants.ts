export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: "Planlegging",
  workshop: "Verksted",
  offshore: "Offshore",
  invoicing: "Fakturering",
  completed: "Fullført",
  standby: "Standby",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: "bg-status-planning",
  workshop: "bg-status-workshop",
  offshore: "bg-status-offshore",
  invoicing: "bg-status-invoicing",
  completed: "bg-status-completed",
  standby: "bg-status-standby",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
  critical: "Kritisk",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-stone text-white",
  medium: "bg-warm-sand text-charcoal",
  high: "bg-coral text-white",
  critical: "bg-error text-white",
};

export const TODO_STATUS_LABELS: Record<string, string> = {
  pending: "Venter",
  in_progress: "Pågår",
  completed: "Fullført",
};

export const LOG_TYPE_LABELS: Record<string, string> = {
  started: "Startet",
  progress: "Fremgang",
  completed: "Fullført",
  issue: "Problem",
};

export const STOCK_STATUS = {
  ok: { label: "OK", color: "text-success" },
  low: { label: "Lav", color: "text-warning" },
  critical: { label: "Kritisk", color: "text-error" },
} as const;

export function getStockStatus(
  quantity: number,
  minStock: number
): keyof typeof STOCK_STATUS {
  if (quantity <= minStock) return "critical";
  if (quantity <= minStock * 1.5) return "low";
  return "ok";
}

export const ROV_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  maintenance: "Vedlikehold",
  retired: "Utgått",
};

export const ROV_STATUS_COLORS: Record<string, string> = {
  active: "bg-status-completed/15 text-status-completed",
  maintenance: "bg-status-invoicing/15 text-status-invoicing",
  retired: "bg-warm-sand text-stone",
};
