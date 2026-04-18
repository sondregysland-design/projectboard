"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PartsTable } from "@/components/inventory/PartsTable";
import { PartForm, type PartFormData } from "@/components/inventory/PartForm";
import { getStockStatus } from "@/lib/constants";
import {
  Plus,
  Loader2,
  Package,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

interface Part {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice: number | null;
  supplier: string | null;
  location: string | null;
}

interface StockCheckResult {
  lowStockParts: Part[];
  newOrders: Array<{
    id: number;
    partName: string;
    partSku: string;
    quantityOrdered: number;
  }>;
}

export default function LagerPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockAlert, setStockAlert] = useState<StockCheckResult | null>(null);

  const fetchParts = useCallback(async () => {
    try {
      const res = await fetch("/api/parts");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setParts(data);
    } catch (err) {
      console.error("Kunne ikke hente deler:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const totalParts = parts.length;
  const lowStockCount = parts.filter(
    (p) => getStockStatus(p.quantity, p.minStock) === "low"
  ).length;
  const criticalStockCount = parts.filter(
    (p) => getStockStatus(p.quantity, p.minStock) === "critical"
  ).length;

  async function handleCheckStock() {
    setCheckingStock(true);
    setStockAlert(null);
    try {
      const res = await fetch("/api/parts/check-stock", { method: "POST" });
      if (!res.ok) throw new Error("Feil ved lagersjekk");
      const data: StockCheckResult = await res.json();
      setStockAlert(data);
      await fetchParts();
    } catch (err) {
      console.error("Kunne ikke sjekke lagerstatus:", err);
    } finally {
      setCheckingStock(false);
    }
  }

  async function handleCreatePart(data: PartFormData) {
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Feil ved opprettelse");
    setFormOpen(false);
    await fetchParts();
  }

  async function handleEditPart(data: PartFormData) {
    if (!editingPart) return;
    const res = await fetch(`/api/parts/${editingPart.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Feil ved oppdatering");
    setEditingPart(null);
    await fetchParts();
  }

  async function handleDeletePart(part: Part) {
    if (!confirm(`Er du sikker p\u00e5 at du vil slette "${part.name}"?`))
      return;
    try {
      const res = await fetch(`/api/parts/${part.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Feil ved sletting");
      await fetchParts();
    } catch (err) {
      console.error("Kunne ikke slette del:", err);
    }
  }

  function handleEdit(part: Part) {
    setEditingPart(part);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">Lager</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/lager/bestillinger">
            <Button variant="secondary">
              <ShoppingCart className="h-4 w-4" />
              Bestillinger
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={handleCheckStock}
            disabled={checkingStock}
          >
            {checkingStock ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sjekk lagerstatus
          </Button>
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Legg til del
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warm-sand/50 p-2.5">
                <Package className="h-5 w-5 text-terracotta" />
              </div>
              <div>
                <p className="text-sm text-stone">Totalt deler</p>
                <p className="text-2xl font-bold text-near-black">
                  {totalParts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-stone">Lav beholdning</p>
                <p className="text-2xl font-bold text-warning">
                  {lowStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-error/10 p-2.5">
                <AlertCircle className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="text-sm text-stone">Kritisk beholdning</p>
                <p className="text-2xl font-bold text-error">
                  {criticalStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock check alert */}
      {stockAlert && (
        <Card className="border-l-4 border-l-success">
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-near-black">
                Lagerstatus sjekket
              </p>
              {stockAlert.lowStockParts.length === 0 ? (
                <p className="text-sm text-success">
                  Alle deler har tilstrekkelig beholdning.
                </p>
              ) : (
                <p className="text-sm text-charcoal">
                  {stockAlert.lowStockParts.length} deler med lav beholdning
                  funnet.
                </p>
              )}
              {stockAlert.newOrders.length > 0 && (
                <div className="text-sm text-charcoal">
                  <p className="font-medium">
                    {stockAlert.newOrders.length} nye bestillinger opprettet:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {stockAlert.newOrders.map((order) => (
                      <li key={order.id}>
                        {order.partName} ({order.partSku}) &mdash;{" "}
                        {order.quantityOrdered} stk
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                variant="ghost"
                className="text-xs mt-1"
                onClick={() => setStockAlert(null)}
              >
                Lukk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster deler...
            </div>
          ) : (
            <PartsTable
              parts={parts}
              onEdit={handleEdit}
              onDelete={handleDeletePart}
            />
          )}
        </CardContent>
      </Card>

      {/* Create form modal */}
      <PartForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreatePart}
      />

      {/* Edit form modal */}
      {editingPart && (
        <PartForm
          open={!!editingPart}
          onClose={() => setEditingPart(null)}
          onSubmit={handleEditPart}
          initialData={{
            name: editingPart.name,
            sku: editingPart.sku,
            description: editingPart.description || "",
            category: editingPart.category || "",
            quantity: editingPart.quantity,
            minStock: editingPart.minStock,
            maxStock: editingPart.maxStock,
            unit: editingPart.unit,
            unitPrice: editingPart.unitPrice || 0,
            supplier: editingPart.supplier || "",
            location: editingPart.location || "",
          }}
        />
      )}
    </div>
  );
}
