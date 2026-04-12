"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, X, PenTool } from "lucide-react";

interface Drawing {
  id: number;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  version: string | null;
}

interface DrawingEditorProps {
  rovSystemId: number;
  drawings: Drawing[];
  onUpdate: () => void;
}

const fileTypeOptions = [
  { value: "pdf", label: "PDF" },
  { value: "dwg", label: "DWG" },
  { value: "png", label: "PNG" },
];

export function DrawingEditor({
  rovSystemId,
  drawings,
  onUpdate,
}: DrawingEditorProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [version, setVersion] = useState("1.0");

  async function handleAdd() {
    if (!name.trim() || !fileType || !fileUrl.trim()) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/drawings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fileType, fileUrl, version }),
      });

      if (!res.ok) throw new Error("Feil");

      setAdding(false);
      setName("");
      setFileType("");
      setFileUrl("");
      setVersion("1.0");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til tegning:", err);
    }
  }

  async function handleRemove(drawingId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/drawings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawingId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne tegning:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Tegninger ({drawings.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til tegning
          </Button>
        )}
      </div>

      {drawings.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen tegninger ennå.
        </p>
      )}

      {drawings.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {drawings.map((drawing) => (
            <div
              key={drawing.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <PenTool className="h-3.5 w-3.5 text-stone shrink-0" />
                <span className="text-near-black truncate">{drawing.name}</span>
                <span className="text-xs text-stone uppercase font-medium">
                  {drawing.fileType}
                </span>
                {drawing.version && (
                  <span className="text-xs text-stone">v{drawing.version}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(drawing.id)}
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
            label="Tegningsnavn *"
            id="drawing-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Hydraulikkskjema hovedsystem"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Filtype *"
              id="drawing-filetype"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              options={fileTypeOptions}
            />
            <Input
              label="Versjon"
              id="drawing-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
            />
          </div>
          <Input
            label="Fil-URL *"
            id="drawing-url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://... eller /files/..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setName("");
                setFileType("");
                setFileUrl("");
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
