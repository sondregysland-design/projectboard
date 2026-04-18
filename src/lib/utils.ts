export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const LOG_TYPE_COLORS: Record<string, string> = {
  started: "bg-status-planning",
  progress: "bg-status-offshore",
  completed: "bg-status-completed",
  issue: "bg-error",
};
