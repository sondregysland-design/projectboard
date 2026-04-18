"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressLogger } from "@/components/workshop/ProgressLogger";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  LOG_TYPE_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Cpu,
  FileText,
  PenTool,
  Clock,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  content: string | null;
  version: string | null;
  fileUrl: string | null;
}

interface Drawing {
  id: number;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  version: string | null;
}

interface WorkshopLog {
  id: number;
  projectId: number;
  message: string;
  logType: string;
  createdBy: string | null;
  createdAt: string;
}

interface ProjectDetail {
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
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  procedures: Procedure[];
  drawings: Drawing[];
  workshopLogs: WorkshopLog[];
}

const logTypeColors: Record<string, string> = {
  started: "bg-status-planning",
  progress: "bg-status-workshop",
  completed: "bg-status-completed",
  issue: "bg-error",
};

const fileTypeBadgeColors: Record<string, string> = {
  pdf: "bg-error/15 text-error",
  dwg: "bg-status-offshore/15 text-status-offshore",
  png: "bg-status-workshop/15 text-status-workshop",
};

export default function WorkshopProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProcedure, setExpandedProcedure] = useState<number | null>(
    null
  );

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error("Kunne ikke hente prosjekt:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Laster prosjekt...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/verksted")}>
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>
        <div className="text-center py-16">
          <p className="text-lg font-medium text-charcoal">
            Prosjektet ble ikke funnet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/verksted")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til verksted
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-serif font-bold text-near-black">
            {project.name}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${PRIORITY_COLORS[project.priority] || ""}`}
          >
            {PRIORITY_LABELS[project.priority] || project.priority}
          </span>
        </div>
      </div>

      {/* Project info card */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-stone" />
                <span className="text-stone">Klient:</span>
                <span className="font-medium text-near-black">
                  {project.client}
                </span>
              </div>
              {project.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-stone" />
                  <span className="text-stone">Lokasjon:</span>
                  <span className="font-medium text-near-black">
                    {project.location}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {project.rovSystemName && (
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-stone" />
                  <span className="text-stone">ROV:</span>
                  <span className="font-medium text-near-black">
                    {project.rovSystemName}
                  </span>
                  {project.rovSystemModel && (
                    <span className="text-xs text-stone">
                      ({project.rovSystemModel})
                    </span>
                  )}
                </div>
              )}
              {project.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-stone" />
                  <span className="text-stone">Tildelt:</span>
                  <span className="font-medium text-near-black">
                    {project.assignedTo}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-stone" />
                <span className="text-stone">Start:</span>
                <span className="text-near-black">
                  {formatDate(project.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-stone" />
                <span className="text-stone">Frist:</span>
                <span className="text-near-black">
                  {formatDate(project.dueDate)}
                </span>
              </div>
            </div>
          </div>
          {project.description && (
            <div className="mt-4 pt-4 border-t border-border-cream">
              <p className="text-sm text-charcoal">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two column: drawings + procedures */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        id="tegninger"
      >
        {/* Drawings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-terracotta" />
              <h2 className="text-lg font-serif font-medium text-near-black">
                Tegninger ({project.drawings.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            {project.drawings.length === 0 ? (
              <p className="text-sm text-stone py-4 text-center">
                Ingen tegninger tilknyttet dette prosjektet.
              </p>
            ) : (
              <div className="space-y-2">
                {project.drawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-warm-sand/20 hover:bg-warm-sand/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PenTool className="h-3.5 w-3.5 text-stone shrink-0" />
                      <span className="text-sm text-near-black truncate">
                        {drawing.name}
                      </span>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${fileTypeBadgeColors[drawing.fileType] || "bg-warm-sand text-charcoal"}`}
                      >
                        {drawing.fileType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <a
                        href={drawing.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-stone hover:text-near-black hover:bg-warm-sand/50 transition-colors"
                        title="Vis"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <a
                        href={drawing.fileUrl}
                        download
                        className="p-1.5 rounded-md text-stone hover:text-near-black hover:bg-warm-sand/50 transition-colors"
                        title="Last ned"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedures */}
        <div id="prosedyrer">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-terracotta" />
              <h2 className="text-lg font-serif font-medium text-near-black">
                Prosedyrer ({project.procedures.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            {project.procedures.length === 0 ? (
              <p className="text-sm text-stone py-4 text-center">
                Ingen prosedyrer tilknyttet dette prosjektet.
              </p>
            ) : (
              <div className="space-y-2">
                {project.procedures.map((proc) => (
                  <div
                    key={proc.id}
                    className="rounded-lg bg-warm-sand/20 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedProcedure(
                          expandedProcedure === proc.id ? null : proc.id
                        )
                      }
                      className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-warm-sand/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-stone shrink-0" />
                        <span className="text-sm text-near-black truncate">
                          {proc.name}
                        </span>
                        {proc.category && (
                          <Badge className="shrink-0">{proc.category}</Badge>
                        )}
                      </div>
                      {expandedProcedure === proc.id ? (
                        <ChevronUp className="h-4 w-4 text-stone shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-stone shrink-0" />
                      )}
                    </button>
                    {expandedProcedure === proc.id && (
                      <div className="px-3 pb-3 border-t border-border-cream/50">
                        {proc.content ? (
                          <p className="text-sm text-charcoal mt-2 whitespace-pre-wrap">
                            {proc.content}
                          </p>
                        ) : proc.description ? (
                          <p className="text-sm text-charcoal mt-2">
                            {proc.description}
                          </p>
                        ) : (
                          <p className="text-sm text-stone mt-2 italic">
                            Ingen innhold tilgjengelig.
                          </p>
                        )}
                        {proc.version && (
                          <p className="text-xs text-stone mt-2">
                            Versjon: {proc.version}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Workshop log / progress section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-serif font-medium text-near-black">
              Verkstedslogg
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Existing logs timeline */}
          {project.workshopLogs.length > 0 && (
            <div className="relative mb-6">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-cream" />

              <div className="space-y-3 sm:space-y-4">
                {project.workshopLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    {/* Timeline dot */}
                    <div
                      className={`w-[19px] h-[19px] rounded-full shrink-0 mt-0.5 border-2 border-ivory ${logTypeColors[log.logType] || "bg-stone"}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-stone">
                          {LOG_TYPE_LABELS[log.logType] || log.logType}
                        </span>
                        <span className="text-xs text-warm-silver">
                          {formatDateTime(log.createdAt)}
                        </span>
                        {log.createdBy && (
                          <span className="text-xs text-stone">
                            &mdash; {log.createdBy}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal mt-0.5">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.workshopLogs.length === 0 && (
            <p className="text-sm text-stone py-4 text-center mb-4">
              Ingen loggoppf&oslash;ringer enn&aring;.
            </p>
          )}

          {/* Add new log entry */}
          <div className="border-t border-border-cream pt-4">
            <h3 className="text-sm font-medium text-near-black mb-3">
              Ny loggoppf&oslash;ring
            </h3>
            <ProgressLogger
              projectId={project.id}
              onLogAdded={fetchProject}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
