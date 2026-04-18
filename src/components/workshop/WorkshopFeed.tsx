"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { MapPin, User, Cpu, FileText, PenTool } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  category: string | null;
}

interface Drawing {
  id: number;
  name: string;
  fileType: string;
}

interface WorkshopProject {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemId: number | null;
  rovSystemName: string | null;
  rovSystemModel: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  procedures: Procedure[];
  drawings: Drawing[];
}

interface WorkshopFeedProps {
  projects: WorkshopProject[];
}

const priorityBorderColors: Record<string, string> = {
  low: "border-l-stone",
  medium: "border-l-warm-sand",
  high: "border-l-coral",
  critical: "border-l-error",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? "dag" : "dager"} siden`;
  }
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? "time" : "timer"} siden`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minutt" : "minutter"} siden`;
  }
  return "Akkurat n\u00e5";
}

export function WorkshopFeed({ projects }: WorkshopFeedProps) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-charcoal">
          Ingen prosjekter i verkstedet
        </p>
        <p className="text-sm text-stone mt-1">
          Prosjekter med status &laquo;Verksted&raquo; vil vises her.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`border-l-4 ${priorityBorderColors[project.priority] || "border-l-stone"} cursor-pointer hover:shadow-md transition-shadow`}
        >
          <CardContent>
            <div
              onClick={() => router.push(`/verksted/${project.id}`)}
              className="space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif font-medium text-near-black text-base">
                  {project.name}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${PRIORITY_COLORS[project.priority] || ""}`}
                >
                  {PRIORITY_LABELS[project.priority] || project.priority}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-charcoal">
                  <User className="h-3.5 w-3.5 text-stone" />
                  {project.client}
                </div>
                {project.location && (
                  <div className="flex items-center gap-2 text-charcoal">
                    <MapPin className="h-3.5 w-3.5 text-stone" />
                    {project.location}
                  </div>
                )}
                {project.rovSystemName && (
                  <div className="flex items-center gap-2 text-charcoal">
                    <Cpu className="h-3.5 w-3.5 text-stone" />
                    {project.rovSystemName}
                    {project.rovSystemModel && (
                      <span className="text-xs text-stone">
                        ({project.rovSystemModel})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Time since arrival */}
              <p className="text-xs text-stone">
                I verkstedet: {timeAgo(project.updatedAt)}
              </p>

              {/* Counts */}
              <div className="flex items-center gap-3 text-xs text-stone">
                {project.drawings.length > 0 && (
                  <span className="flex items-center gap-1">
                    <PenTool className="h-3 w-3" />
                    {project.drawings.length} tegninger
                  </span>
                )}
                {project.procedures.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {project.procedures.length} prosedyrer
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border-cream">
              <Button
                variant="secondary"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/verksted/${project.id}#tegninger`);
                }}
              >
                <PenTool className="h-3.5 w-3.5" />
                Se tegninger
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/verksted/${project.id}#prosedyrer`);
                }}
              >
                <FileText className="h-3.5 w-3.5" />
                Se prosedyrer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
