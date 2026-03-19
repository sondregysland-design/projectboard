const statusColors: Record<string, string> = {
  planning: "bg-gray-100 text-gray-600",
  workshop: "bg-blue-100 text-blue-700",
  offshore: "bg-amber-100 text-amber-700",
  invoicing: "bg-purple-100 text-purple-700",
  finished: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const color = statusColors[label] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
    >
      {label}
    </span>
  );
}
