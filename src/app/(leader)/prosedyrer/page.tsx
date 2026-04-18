"use client";

import { useState, useEffect, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ProcedureList } from "@/components/procedures/ProcedureList";
import { Plus, Loader2 } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  rovSystemId: number | null;
  category: string | null;
  content: string | null;
  version: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RovSystem {
  id: number;
  name: string;
}

interface ProcedureFormData {
  name: string;
  description: string;
  rovSystemId: string;
  category: string;
  content: string;
  version: string;
  fileUrl: string;
}

const defaultForm: ProcedureFormData = {
  name: "",
  description: "",
  rovSystemId: "",
  category: "",
  content: "",
  version: "1.0",
  fileUrl: "",
};

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [rovSystems, setRovSystems] = useState<RovSystem[]>([]);
  const [filterRovId, setFilterRovId] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProcedureFormData>(defaultForm);

  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterRovId
        ? `/api/procedures?rovSystemId=${filterRovId}`
        : "/api/procedures";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProcedures(data);
    } catch (err) {
      console.error("Kunne ikke hente prosedyrer:", err);
    } finally {
      setLoading(false);
    }
  }, [filterRovId]);

  const fetchRovSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/rov-systems");
      if (!res.ok) return;
      const data = await res.json();
      setRovSystems(data);
    } catch {
      console.error("Kunne ikke hente ROV-systemer");
    }
  }, []);

  useEffect(() => {
    fetchRovSystems();
  }, [fetchRovSystems]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const rovSystemNames: Record<number, string> = {};
  for (const sys of rovSystems) {
    rovSystemNames[sys.id] = sys.name;
  }

  const rovOptions = rovSystems.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateProcedure(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        content: form.content || null,
        version: form.version || "1.0",
        fileUrl: form.fileUrl || null,
        rovSystemId: form.rovSystemId ? parseInt(form.rovSystemId, 10) : null,
      };

      const res = await fetch("/api/procedures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Feil ved opprettelse");
      setFormOpen(false);
      setForm(defaultForm);
      await fetchProcedures();
    } catch (err) {
      console.error("Kunne ikke opprette prosedyre:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Prosedyrer
        </h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Legg til prosedyre
        </Button>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select
          label="Filtrer etter ROV-system"
          id="rovFilter"
          value={filterRovId}
          onChange={(e) => setFilterRovId(e.target.value)}
          options={rovOptions}
        />
      </div>

      {/* Procedure list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Laster prosedyrer...
        </div>
      ) : (
        <ProcedureList
          procedures={procedures}
          rovSystemNames={rovSystemNames}
        />
      )}

      {/* Create procedure modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Ny prosedyre"
      >
        <form onSubmit={handleCreateProcedure} className="space-y-4">
          <Input
            label="Navn *"
            id="name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="Prosedyrenavn"
            required
          />

          <Textarea
            label="Beskrivelse"
            id="description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            placeholder="Kort beskrivelse"
          />

          <Select
            label="ROV-system"
            id="rovSystemId"
            name="rovSystemId"
            value={form.rovSystemId}
            onChange={handleFormChange}
            options={rovOptions}
          />

          <Input
            label="Kategori"
            id="category"
            name="category"
            value={form.category}
            onChange={handleFormChange}
            placeholder="F.eks. Vedlikehold, Sikkerhet"
          />

          <Textarea
            label="Innhold"
            id="content"
            name="content"
            value={form.content}
            onChange={handleFormChange}
            placeholder="Prosedyrens innhold"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Versjon"
              id="version"
              name="version"
              value={form.version}
              onChange={handleFormChange}
              placeholder="1.0"
            />
            <Input
              label="Fil-URL"
              id="fileUrl"
              name="fileUrl"
              value={form.fileUrl}
              onChange={handleFormChange}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" variant="primary">
              Opprett prosedyre
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
