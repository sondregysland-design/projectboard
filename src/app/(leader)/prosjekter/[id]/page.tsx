"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import {
  ProjectForm,
  type ProjectFormData,
} from "@/components/projects/ProjectForm";
import { RovSystemPicker } from "@/components/projects/RovSystemPicker";
import { PRIORITY_LABELS, PRIORITY_COLORS, LOG_TYPE_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Calendar,
  Pencil,
  Cpu,
  FileText,
  PenTool,
  Package,
  Clock,
  FileDown,
} from "lucide-react";

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

interface PartUsage {
  id: number;
  partId: number;
  quantityUsed: number;
  deductedAt: string;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
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
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  procedures: Procedure[];
  drawings: Drawing[];
  partsUsage: PartUsage[];
  workshopLogs: WorkshopLog[];
}

const logTypeColors: Record<string, string> = {
  started: "bg-status-planning",
  progress: "bg-status-workshop",
  completed: "bg-status-completed",
  issue: "bg-error",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error("Kunne ikke hente prosjekt:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
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

  async function handleEditSubmit(data: ProjectFormData) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved oppdatering");
      setEditOpen(false);
      await fetchProject();
    } catch (err) {
      console.error("Kunne ikke oppdatere prosjekt:", err);
    }
  }

  async function handleGenerateReport() {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/report`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Feil ved generering av rapport");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.name || "prosjekt"}-rapport.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Rapport-generering feilet:", err);
    } finally {
      setReportLoading(false);
    }
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
        <Button variant="ghost" onClick={() => router.push("/prosjekter")}>
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

  const editInitialData: Partial<ProjectFormData> = {
    name: project.name,
    client: project.client,
    location: project.location || "",
    description: project.description || "",
    priority: project.priority,
    assignedTo: project.assignedTo || "",
    startDate: project.startDate || "",
    dueDate: project.dueDate || "",
  };

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/prosjekter")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til prosjekter
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-serif font-bold text-near-black">
            {project.name}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              disabled={reportLoading}
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {reportLoading ? "Genererer..." : "Generer rapport"}
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Rediger
            </Button>
          </div>
        </div>
      </div>

      {/* Project info card */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-3">
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

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone">Status:</span>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone">Prioritet:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                    PRIORITY_COLORS[project.priority] || ""
                  }`}
                >
                  {PRIORITY_LABELS[project.priority] || project.priority}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-stone" />
                <span className="text-stone">Start:</span>
                <span className="text-near-black">
                  {formatDate(project.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-stone" />
                <span className="text-stone">Frist:</span>
                <span className="text-near-black">
                  {formatDate(project.dueDate)}
                </span>
              </div>
              {project.completedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-success" />
                  <span className="text-stone">Fullført:</span>
                  <span className="text-success font-medium">
                    {formatDate(project.completedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {project.description && (
            <div className="mt-4 pt-4 border-t border-border-cream">
              <p className="text-sm text-charcoal">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROV System Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-terracotta" />
            <h2 className="text-lg font-serif font-medium text-near-black">
              ROV-system
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          {project.rovSystemId ? (
            <div className="space-y-6">
              {/* Current ROV system info */}
              <div className="flex items-center gap-3 rounded-lg bg-warm-sand/40 px-4 py-3">
                <Cpu className="h-5 w-5 text-terracotta" />
                <div>
                  <p className="font-medium text-near-black">
                    {project.rovSystemName}
                  </p>
                  {project.rovSystemModel && (
                    <p className="text-xs text-stone">
                      Modell: {project.rovSystemModel}
                    </p>
                  )}
                </div>
              </div>

              {/* Linked procedures */}
              {project.procedures.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-terracotta" />
                    <h3 className="text-sm font-medium text-near-black">
                      Prosedyrer ({project.procedures.length})
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {project.procedures.map((proc) => (
                      <button
                        key={proc.id}
                        onClick={() =>
                          router.push(`/prosedyrer?id=${proc.id}`)
                        }
                        className="flex items-center gap-2 w-full text-left rounded-lg px-3 py-2 text-sm text-charcoal hover:bg-warm-sand/30 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-stone" />
                        {proc.name}
                        {proc.category && (
                          <Badge className="ml-auto">{proc.category}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked drawings */}
              {project.drawings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PenTool className="h-4 w-4 text-terracotta" />
                    <h3 className="text-sm font-medium text-near-black">
                      Tegninger ({project.drawings.length})
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {project.drawings.map((drawing) => (
                      <div
                        key={drawing.id}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-charcoal bg-warm-sand/20"
                      >
                        <PenTool className="h-3.5 w-3.5 text-stone" />
                        {drawing.name}
                        <span className="ml-auto text-xs text-stone uppercase">
                          {drawing.fileType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts used */}
              {project.partsUsage.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-terracotta" />
                    <h3 className="text-sm font-medium text-near-black">
                      Deler brukt ({project.partsUsage.length})
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {project.partsUsage.map((usage) => (
                      <div
                        key={usage.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
                      >
                        <div>
                          <span className="text-near-black">
                            {usage.partName || "Ukjent del"}
                          </span>
                          {usage.partSku && (
                            <span className="ml-2 text-xs text-stone">
                              {usage.partSku}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-stone">
                          x{usage.quantityUsed}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <RovSystemPicker
              projectId={project.id}
              currentRovSystemId={project.rovSystemId}
              onAssign={fetchProject}
            />
          )}
        </CardContent>
      </Card>

      {/* Workshop log timeline */}
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
          {project.workshopLogs.length === 0 ? (
            <p className="text-sm text-stone py-4 text-center">
              Ingen loggoppføringer ennå.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-cream" />

              <div className="space-y-3 sm:space-y-4">
                {project.workshopLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 sm:gap-4 relative">
                    {/* Timeline dot */}
                    <div
                      className={`w-[19px] h-[19px] rounded-full shrink-0 mt-0.5 border-2 border-ivory ${
                        logTypeColors[log.logType] || "bg-stone"
                      }`}
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
        </CardContent>
      </Card>

      {/* Edit form modal */}
      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={editInitialData}
      />
    </div>
  );
}
