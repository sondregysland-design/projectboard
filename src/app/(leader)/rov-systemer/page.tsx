"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { RovSystemTable } from "@/components/rov-systems/RovSystemTable";
import {
  RovSystemForm,
  type RovSystemFormData,
} from "@/components/rov-systems/RovSystemForm";
import { Plus, Loader2 } from "lucide-react";

interface RovSystemListItem {
  id: number;
  name: string;
  model: string;
  status: string;
  bomCount: number;
  createdAt: string;
}

type TabId = "active" | "maintenance" | "retired";

export default function RovSystemsPage() {
  const [systems, setSystems] = useState<RovSystemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [formOpen, setFormOpen] = useState(false);

  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/rov-systems");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();

      const enriched: RovSystemListItem[] = await Promise.all(
        data.map(async (system: { id: number; name: string; model: string; status: string; createdAt: string }) => {
          const detailRes = await fetch(`/api/rov-systems/${system.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            return { ...system, bomCount: detail.parts?.length || 0 };
          }
          return { ...system, bomCount: 0 };
        })
      );

      setSystems(enriched);
    } catch (err) {
      console.error("Kunne ikke hente ROV-systemer:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const activeSystems = systems.filter((s) => s.status === "active");
  const maintenanceSystems = systems.filter((s) => s.status === "maintenance");
  const retiredSystems = systems.filter((s) => s.status === "retired");

  const filteredSystems =
    activeTab === "active"
      ? activeSystems
      : activeTab === "maintenance"
        ? maintenanceSystems
        : retiredSystems;

  const tabs = [
    { id: "active", label: "Aktive", count: activeSystems.length },
    {
      id: "maintenance",
      label: "Vedlikehold",
      count: maintenanceSystems.length,
    },
    { id: "retired", label: "Utgåtte", count: retiredSystems.length },
  ];

  async function handleCreateSystem(data: RovSystemFormData) {
    try {
      const res = await fetch("/api/rov-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved opprettelse");
      setFormOpen(false);
      await fetchSystems();
    } catch (err) {
      console.error("Kunne ikke opprette ROV-system:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          ROV-systemer
        </h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Legg til ROV-system
        </Button>
      </div>

      <Tabs
        tabs={tabs}
        defaultTab="active"
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster ROV-systemer...
            </div>
          ) : (
            <RovSystemTable systems={filteredSystems} />
          )}
        </CardContent>
      </Card>

      <RovSystemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateSystem}
      />
    </div>
  );
}
