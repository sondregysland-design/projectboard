"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectRowExpander } from "./ProjectRowExpander";
import { PRIORITY_LABELS, PRIORITY_COLORS, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { FolderKanban, ChevronDown, ChevronRight } from "lucide-react";

interface Project {
  id: number;
  name: string;
  client: string;
  location: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  rovSystemName: string | null;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
}

interface ProjectTableProps {
  projects: Project[];
  onProjectUpdated: () => void;
}

const STATUS_OPTIONS = [
  "planning",
  "workshop",
  "offshore",
  "invoicing",
  "completed",
  "standby",
];

export function ProjectTable({ projects, onProjectUpdated }: ProjectTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <FolderKanban className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen prosjekter funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett et nytt prosjekt for å komme i gang.
        </p>
      </div>
    );
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function handleStatusChange(projectId: number, newStatus: string) {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onProjectUpdated();
    } catch (err) {
      console.error("Kunne ikke oppdatere status:", err);
    }
  }

  function toggleExpand(projectId: number, e: React.MouseEvent) {
    e.stopPropagation();
    setExpandedId(expandedId === projectId ? null : projectId);
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {projects.map((project) => (
          <div key={project.id}>
            <div
              className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0" onClick={(e) => toggleExpand(project.id, e)}>
                  <button className="shrink-0 text-stone hover:text-near-black">
                    {expandedId === project.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0" onClick={() => router.push(`/prosjekter/${project.id}`)}>
                    <p className="font-medium text-near-black truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-charcoal mt-0.5">{project.client}</p>
                  </div>
                </div>
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(project.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs rounded-md border border-border-cream bg-ivory px-2 py-1 text-charcoal"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              {project.rovSystemName && (
                <p className="text-xs text-stone mb-2 ml-6">
                  ROV: {project.rovSystemName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap ml-6">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    PRIORITY_COLORS[project.priority] || ""
                  }`}
                >
                  {PRIORITY_LABELS[project.priority] || project.priority}
                </span>
                {project.dueDate && (
                  <span className="text-xs text-stone">
                    Frist: {formatDate(project.dueDate)}
                  </span>
                )}
              </div>
            </div>
            {expandedId === project.id && (
              <ProjectRowExpander
                project={project}
                onProjectUpdated={onProjectUpdated}
              />
            )}
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-cream text-left">
              <th className="pb-3 pt-1 w-8"></th>
              <th className="pb-3 pt-1 font-medium text-stone">Prosjekt</th>
              <th className="pb-3 pt-1 font-medium text-stone">Klient</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                ROV System
              </th>
              <th className="pb-3 pt-1 font-medium text-stone">Status</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden sm:table-cell">
                Prioritet
              </th>
              <th className="pb-3 pt-1 font-medium text-stone hidden lg:table-cell">
                Frist
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <>
                <tr
                  key={project.id}
                  className={`border-b border-border-cream last:border-b-0 cursor-pointer hover:bg-warm-sand/30 transition-colors ${
                    expandedId === project.id ? "bg-warm-sand/20" : ""
                  }`}
                >
                  <td className="py-3 pr-1">
                    <button
                      onClick={(e) => toggleExpand(project.id, e)}
                      className="text-stone hover:text-near-black p-1"
                    >
                      {expandedId === project.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td
                    className="py-3 pr-4"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    <span className="font-medium text-near-black">
                      {project.name}
                    </span>
                    {project.location && (
                      <span className="block text-xs text-stone mt-0.5">
                        {project.location}
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3 pr-4 text-charcoal"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {project.client}
                  </td>
                  <td
                    className="py-3 pr-4 text-charcoal hidden md:table-cell"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {project.rovSystemName || (
                      <span className="text-stone italic">Ikke tildelt</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={project.status}
                      onChange={(e) =>
                        handleStatusChange(project.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs rounded-md border border-border-cream bg-ivory px-2 py-1 text-charcoal focus:outline-none focus:ring-1 focus:ring-terracotta"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {PROJECT_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className="py-3 pr-4 hidden sm:table-cell"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        PRIORITY_COLORS[project.priority] || ""
                      }`}
                    >
                      {PRIORITY_LABELS[project.priority] || project.priority}
                    </span>
                  </td>
                  <td
                    className="py-3 text-charcoal hidden lg:table-cell"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {formatDate(project.dueDate)}
                  </td>
                </tr>
                {expandedId === project.id && (
                  <tr key={`${project.id}-expand`}>
                    <td colSpan={7} className="p-0">
                      <ProjectRowExpander
                        project={project}
                        onProjectUpdated={onProjectUpdated}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
