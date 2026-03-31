"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/prosedyrer/DropZone";
import { ProcedureCard } from "@/components/prosedyrer/ProcedureCard";
import { ProcedureGrid } from "@/components/prosedyrer/ProcedureGrid";
import { showToast } from "@/components/ui/Toaster";
import type { Procedure } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ProsedyrerPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [showDropZone, setShowDropZone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcedures();
  }, []);

  async function fetchProcedures() {
    try {
      const res = await fetch("/api/prosedyrer");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setProcedures(data);
    } catch {
      showToast("Kunne ikke hente prosedyrer");
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: File[]) {
    const supabase = createClient();

    for (const file of files) {
      const id = generateId();
      const storagePath = `prosedyrer/${id}_${file.name}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        const proc: Procedure = {
          id,
          name: file.name.replace(/\.pdf$/i, ""),
          description: "",
          url: "",
          storagePath,
          size: file.size,
          uploadedAt: new Date().toISOString().split("T")[0],
        };

        await fetch("/api/prosedyrer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proc),
        });

        setProcedures((prev) => [...prev, proc]);
        showToast(`"${proc.name}" lastet opp`);
      } catch {
        showToast(`Kunne ikke laste opp ${file.name}`);
      }
    }

    setShowDropZone(false);
  }

  async function handleSave(proc: Procedure) {
    setProcedures((prev) =>
      prev.map((p) => (p.id === proc.id ? proc : p))
    );

    try {
      await fetch("/api/prosedyrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proc),
      });
      showToast("Prosedyre oppdatert");
    } catch {
      showToast("Kunne ikke lagre endringer");
    }
  }

  async function handleDelete(id: string) {
    const proc = procedures.find((p) => p.id === id);
    setProcedures((prev) => prev.filter((p) => p.id !== id));

    try {
      if (proc?.storagePath) {
        const supabase = createClient();
        await supabase.storage.from("documents").remove([proc.storagePath]);
      }

      await fetch(`/api/prosedyrer?id=${id}`, { method: "DELETE" });
      showToast("Prosedyre slettet");
    } catch {
      showToast("Kunne ikke slette prosedyre");
    }
  }

  async function handleOpen(id: string) {
    const proc = procedures.find((p) => p.id === id);
    if (!proc?.storagePath) return;

    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(proc.storagePath, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      showToast("Kunne ikke apne PDF");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        title="Prosy"
        highlight="dyrer"
        subtitle="Administrer prosedyrer og dokumenter"
        actions={
          <Button onClick={() => setShowDropZone(!showDropZone)}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Last opp
          </Button>
        }
      />

      {showDropZone && (
        <div className="mb-6">
          <DropZone onFiles={handleFiles} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-text-light">
          Laster prosedyrer...
        </div>
      ) : procedures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="mb-4 h-12 w-12 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium text-text">Ingen prosedyrer</p>
          <p className="mt-1 text-xs text-text-light">
            Last opp PDF-filer for a komme i gang
          </p>
        </div>
      ) : (
        <ProcedureGrid>
          {procedures.map((proc) => (
            <ProcedureCard
              key={proc.id}
              procedure={proc}
              onSave={handleSave}
              onDelete={handleDelete}
              onOpen={handleOpen}
            />
          ))}
        </ProcedureGrid>
      )}
    </main>
  );
}
