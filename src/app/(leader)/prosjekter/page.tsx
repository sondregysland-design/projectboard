"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { ProjectForm, type ProjectFormData } from "@/components/projects/ProjectForm";
import { Plus, Loader2 } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemId: number | null;
  rovSystemName: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

type TabId = "active" | "standby";

const ACTIVE_STATUSES = ["planning", "workshop", "offshore", "invoicing"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [formOpen, setFormOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Kunne ikke hente prosjekter:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeProjects = projects.filter((p) =>
    ACTIVE_STATUSES.includes(p.status)
  );
  const standbyProjects = projects.filter((p) => p.status === "standby");

  const filteredProjects =
    activeTab === "active" ? activeProjects : standbyProjects;

  const tabs = [
    { id: "active", label: "Aktive", count: activeProjects.length },
    { id: "standby", label: "Standby", count: standbyProjects.length },
  ];

  async function handleCreateProject(data: ProjectFormData) {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved opprettelse");
      setFormOpen(false);
      await fetchProjects();
    } catch (err) {
      console.error("Kunne ikke opprette prosjekt:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Prosjektstyring
        </h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Legg til prosjekt
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab="active"
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Project table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster prosjekter...
            </div>
          ) : (
            <ProjectTable
              projects={filteredProjects}
              onProjectUpdated={fetchProjects}
            />
          )}
        </CardContent>
      </Card>

      {/* Create form modal */}
      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
