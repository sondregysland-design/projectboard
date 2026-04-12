"use client";

import { useRouter } from "next/navigation";
import { ROV_STATUS_LABELS, ROV_STATUS_COLORS } from "@/lib/constants";
import { Anchor } from "lucide-react";

interface RovSystem {
  id: number;
  name: string;
  model: string;
  status: string;
  bomCount: number;
  createdAt: string;
}

interface RovSystemTableProps {
  systems: RovSystem[];
}

export function RovSystemTable({ systems }: RovSystemTableProps) {
  const router = useRouter();

  if (systems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <Anchor className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen ROV-systemer funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett et nytt ROV-system for å komme i gang.
        </p>
      </div>
    );
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {systems.map((system) => (
          <div
            key={system.id}
            onClick={() => router.push(`/rov-systemer/${system.id}`)}
            className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-near-black truncate">
                  {system.name}
                </p>
                <p className="text-xs text-charcoal mt-0.5">{system.model}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                  ROV_STATUS_COLORS[system.status] || ""
                }`}
              >
                {ROV_STATUS_LABELS[system.status] || system.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone">
              <span>{system.bomCount} deler i BOM</span>
              <span>&middot;</span>
              <span>{formatDate(system.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-cream text-left">
              <th className="pb-3 pt-1 font-medium text-stone">Navn</th>
              <th className="pb-3 pt-1 font-medium text-stone">Modell</th>
              <th className="pb-3 pt-1 font-medium text-stone">Status</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                BOM-deler
              </th>
              <th className="pb-3 pt-1 font-medium text-stone hidden lg:table-cell">
                Opprettet
              </th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => (
              <tr
                key={system.id}
                onClick={() => router.push(`/rov-systemer/${system.id}`)}
                className="border-b border-border-cream last:border-b-0 cursor-pointer hover:bg-warm-sand/30 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-near-black">
                    {system.name}
                  </span>
                </td>
                <td className="py-3 pr-4 text-charcoal">{system.model}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      ROV_STATUS_COLORS[system.status] || ""
                    }`}
                  >
                    {ROV_STATUS_LABELS[system.status] || system.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                  {system.bomCount}
                </td>
                <td className="py-3 text-charcoal hidden lg:table-cell">
                  {formatDate(system.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
