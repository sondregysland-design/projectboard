import type { Project } from "@/lib/types";
import { COMPLETED_STATUSES } from "@/lib/constants";

interface SummaryCardsProps {
  projects: Project[];
}

export function SummaryCards({ projects }: SummaryCardsProps) {
  const total = projects.length;
  const active = projects.filter(
    (p) => !COMPLETED_STATUSES.includes(p.status as any) && !p.isStandin
  ).length;
  const finished = projects.filter((p) =>
    COMPLETED_STATUSES.includes(p.status as any)
  ).length;
  const offshore = projects.filter((p) => p.status === "offshore").length;

  const cards = [
    {
      label: "Totalt",
      value: total,
      color: "bg-primary/10 text-primary",
      border: "border-primary/20",
    },
    {
      label: "Aktive",
      value: active,
      color: "bg-blue-50 text-blue-700",
      border: "border-blue-100",
    },
    {
      label: "Fullførte",
      value: finished,
      color: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-100",
    },
    {
      label: "Offshore",
      value: offshore,
      color: "bg-amber-50 text-amber-700",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} bg-white p-6 shadow-sm transition hover:shadow-md`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-light">
            {card.label}
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${card.color.split(" ").find((c) => c.startsWith("text-"))}`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
