"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { getStockStatus, STOCK_STATUS } from "@/lib/constants";
import { Plus, X, Package } from "lucide-react";

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

interface AvailablePart {
  id: number;
  name: string;
  sku: string;
  category: string | null;
}

interface BomEditorProps {
  rovSystemId: number;
  entries: BomEntry[];
  onUpdate: () => void;
}

export function BomEditor({ rovSystemId, entries, onUpdate }: BomEditorProps) {
  const [adding, setAdding] = useState(false);
  const [availableParts, setAvailableParts] = useState<AvailablePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (adding) {
      fetch("/api/parts")
        .then((res) => res.json())
        .then((data) => setAvailableParts(data))
        .catch((err) => console.error("Kunne ikke hente deler:", err));
    }
  }, [adding]);

  async function handleAdd() {
    if (!selectedPartId || !quantity) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: parseInt(selectedPartId, 10),
          quantityRequired: parseInt(quantity, 10),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Feil ved tillegging");
        return;
      }

      setAdding(false);
      setSelectedPartId("");
      setQuantity("1");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til del:", err);
    }
  }

  async function handleRemove(bomId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/parts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bomId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne del:", err);
    }
  }

  const existingPartIds = new Set(entries.map((e) => e.partId));
  const selectableParts = availableParts.filter(
    (p) => !existingPartIds.has(p.id)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Stykkliste (BOM) ({entries.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til del
          </Button>
        )}
      </div>

      {entries.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen deler i stykklisten ennå.
        </p>
      )}

      {entries.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {entries.map((entry) => {
            const stockStatus =
              entry.partQuantity !== null && entry.partMinStock !== null
                ? getStockStatus(entry.partQuantity, entry.partMinStock)
                : null;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-near-black font-medium truncate">
                    {entry.partName || "Ukjent del"}
                  </span>
                  {entry.partSku && (
                    <span className="text-xs text-stone">{entry.partSku}</span>
                  )}
                  {entry.partCategory && (
                    <span className="text-xs text-stone hidden sm:inline">
                      {entry.partCategory}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-charcoal">
                    x{entry.quantityRequired}
                  </span>
                  {stockStatus && (
                    <span
                      className={`text-xs font-medium ${STOCK_STATUS[stockStatus].color}`}
                    >
                      {entry.partQuantity} på lager
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="p-1 rounded text-stone hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="rounded-lg border border-border-cream p-3 space-y-3">
          <Select
            label="Del"
            id="bom-part"
            name="partId"
            value={selectedPartId}
            onChange={(e) => setSelectedPartId(e.target.value)}
            options={selectableParts.map((p) => ({
              value: String(p.id),
              label: `${p.name} (${p.sku})`,
            }))}
          />
          <Input
            label="Antall påkrevd"
            id="bom-qty"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setSelectedPartId("");
                setQuantity("1");
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
