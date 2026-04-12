"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Plus, X, FileText } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  version: string | null;
}

interface ProcedureEditorProps {
  rovSystemId: number;
  procedures: Procedure[];
  onUpdate: () => void;
}

export function ProcedureEditor({
  rovSystemId,
  procedures,
  onUpdate,
}: ProcedureEditorProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");

  async function handleAdd() {
    if (!name.trim()) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: category || null,
          description: description || null,
          version,
        }),
      });

      if (!res.ok) throw new Error("Feil");

      setAdding(false);
      setName("");
      setCategory("");
      setDescription("");
      setVersion("1.0");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til prosedyre:", err);
    }
  }

  async function handleRemove(procedureId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/procedures`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne prosedyre:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Prosedyrer ({procedures.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til prosedyre
          </Button>
        )}
      </div>

      {procedures.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen prosedyrer ennå.
        </p>
      )}

      {procedures.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {procedures.map((proc) => (
            <div
              key={proc.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-stone shrink-0" />
                <span className="text-near-black truncate">{proc.name}</span>
                {proc.category && <Badge>{proc.category}</Badge>}
                {proc.version && (
                  <span className="text-xs text-stone">v{proc.version}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(proc.id)}
                className="p-1 rounded text-stone hover:text-error hover:bg-error/10 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="rounded-lg border border-border-cream p-3 space-y-3">
          <Input
            label="Prosedyrenavn *"
            id="proc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Oppstart av hydraulikksystem"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kategori"
              id="proc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="F.eks. Hydraulikk"
            />
            <Input
              label="Versjon"
              id="proc-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
            />
          </div>
          <Textarea
            label="Beskrivelse"
            id="proc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kort beskrivelse av prosedyren"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setName("");
                setCategory("");
                setDescription("");
                setVersion("1.0");
              }}
            >
              Avbryt
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Legg til
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
