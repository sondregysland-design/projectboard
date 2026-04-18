import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";

export function ProjectStatusBadge({ status }: { status: string }) {
  const variant = status as
    | "planning"
    | "workshop"
    | "offshore"
    | "invoicing"
    | "completed"
    | "standby";
  return <Badge variant={variant}>{PROJECT_STATUS_LABELS[status] || status}</Badge>;
}
