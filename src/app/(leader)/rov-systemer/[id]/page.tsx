"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  RovSystemForm,
  type RovSystemFormData,
} from "@/components/rov-systems/RovSystemForm";
import { BomEditor } from "@/components/rov-systems/BomEditor";
import { ProcedureEditor } from "@/components/rov-systems/ProcedureEditor";
import { DrawingEditor } from "@/components/rov-systems/DrawingEditor";
import { ROV_STATUS_LABELS, ROV_STATUS_COLORS } from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Anchor,
  Archive,
  Trash2,
} from "lucide-react";

interface BomEntry {
  id: number;
  partId: number;
  quantityRequired: number;
  notes: string | null;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
  partQuantity: number | null;
  partMinStock: number | null;
  partUnit: string | null;
}

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  version: string | null;
}

interface Drawing {
  id: number;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  version: string | null;
}

interface LinkedProject {
  id: number;
  status: string;
}

interface RovSystemDetail {
  id: number;
  name: string;
  model: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  parts: BomEntry[];
  procedures: Procedure[];
  drawings: Drawing[];
  linkedProjects: LinkedProject[];
}

export default function RovSystemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [system, setSystem] = useState<RovSystemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchSystem = useCallback(async () => {
    try {
      const res = await fetch(`/api/rov-systems/${id}`);
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setSystem(data);
    } catch (err) {
      console.error("Kunne ikke hente ROV-system:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSystem();
  }, [fetchSystem]);

  async function handleEditSubmit(data: RovSystemFormData) {
    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved oppdatering");
      setEditOpen(false);
      await fetchSystem();
    } catch (err) {
      console.error("Kunne ikke oppdatere ROV-system:", err);
    }
  }

  async function handleRetire() {
    if (!confirm("Er du sikker på at du vil sette systemet som utgått?"))
      return;

    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "retired" }),
      });
      if (!res.ok) throw new Error("Feil");
      await fetchSystem();
    } catch (err) {
      console.error("Kunne ikke sette system som utgått:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("Er du sikker på at du vil slette dette ROV-systemet?"))
      return;

    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Feil ved sletting");
        return;
      }

      router.push("/rov-systemer");
    } catch (err) {
      console.error("Kunne ikke slette ROV-system:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Laster ROV-system...
      </div>
    );
  }

  if (!system) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/rov-systemer")}>
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>
        <div className="text-center py-16">
          <p className="text-lg font-medium text-charcoal">
            ROV-systemet ble ikke funnet
          </p>
        </div>
      </div>
    );
  }

  const hasLinkedProjects = system.linkedProjects.length > 0;
  const editInitialData: Partial<RovSystemFormData> = {
    name: system.name,
    model: system.model,
    description: system.description || "",
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/rov-systemer")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til ROV-systemer
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-serif font-bold text-near-black">
            {system.name}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Rediger
            </Button>
            {system.status !== "retired" && hasLinkedProjects && (
              <Button variant="secondary" onClick={handleRetire}>
                <Archive className="h-4 w-4" />
                Sett som utgått
              </Button>
            )}
            {!hasLinkedProjects && (
              <Button variant="secondary" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Slett
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-warm-sand p-2">
              <Anchor className="h-5 w-5 text-terracotta" />
            </div>
            <div>
              <p className="font-medium text-near-black">{system.name}</p>
              <p className="text-sm text-stone">Modell: {system.model}</p>
            </div>
            <span
              className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                ROV_STATUS_COLORS[system.status] || ""
              }`}
            >
              {ROV_STATUS_LABELS[system.status] || system.status}
            </span>
          </div>
          {system.description && (
            <p className="text-sm text-charcoal border-t border-border-cream pt-3">
              {system.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <BomEditor
            rovSystemId={system.id}
            entries={system.parts}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ProcedureEditor
            rovSystemId={system.id}
            procedures={system.procedures}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DrawingEditor
            rovSystemId={system.id}
            drawings={system.drawings}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      <RovSystemForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={editInitialData}
      />
    </div>
  );
}
