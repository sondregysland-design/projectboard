"use client";

import { useState, useEffect, useCallback } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileText,
  PenTool,
  ShoppingCart,
} from "lucide-react";

interface RovSystem {
  id: number;
  name: string;
  model: string;
  status: string;
}

interface BomItem {
  id: number;
  partId: number;
  quantityRequired: number;
  notes: string | null;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
  partQuantity: number | null;
  partUnit: string | null;
}

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

interface RovSystemDetails extends RovSystem {
  parts: BomItem[];
  procedures: Procedure[];
  drawings: Drawing[];
}

interface AssignResult {
  partsUsed: {
    partName: string | null;
    partSku: string | null;
    quantityUsed: number;
    previousQuantity: number | null;
    newQuantity: number;
  }[];
  stockWarnings: {
    partName: string | null;
    partSku: string | null;
    currentQuantity: number;
    minStock: number | null;
  }[];
  ordersCreated: {
    partName: string | null;
    partSku: string | null;
    quantityOrdered: number;
  }[];
}

interface RovSystemPickerProps {
  projectId: number;
  currentRovSystemId?: number | null;
  onAssign: () => void;
}

export function RovSystemPicker({
  projectId,
  currentRovSystemId,
  onAssign,
}: RovSystemPickerProps) {
  const [systems, setSystems] = useState<RovSystem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [details, setDetails] = useState<RovSystemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<AssignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available ROV systems
  useEffect(() => {
    setLoading(true);
    fetch("/api/rov-systems")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSystems(data.filter((s: RovSystem) => s.status !== "retired"));
        }
      })
      .catch(() => setError("Kunne ikke hente ROV-systemer"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch details when a system is selected
  const fetchDetails = useCallback(async (systemId: string) => {
    if (!systemId) {
      setDetails(null);
      return;
    }
    setLoadingDetails(true);
    setError(null);
    try {
      const res = await fetch(`/api/rov-systems?id=${systemId}`);
      if (!res.ok) throw new Error("Feil ved henting");
      const data = await res.json();
      setDetails(data);
    } catch {
      setError("Kunne ikke hente detaljer for ROV-systemet");
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedId(val);
    setAssignResult(null);
    fetchDetails(val);
  }

  async function handleAssign() {
    if (!selectedId) return;
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/rov`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rovSystemId: parseInt(selectedId, 10) }),
      });
      if (!res.ok) throw new Error("Feil ved tildeling");
      const data = await res.json();
      setAssignResult({
        partsUsed: data.partsUsed || [],
        stockWarnings: data.stockWarnings || [],
        ordersCreated: data.ordersCreated || [],
      });
      onAssign();
    } catch {
      setError("Kunne ikke tildele ROV-system til prosjektet");
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-stone">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Laster ROV-systemer...</span>
      </div>
    );
  }

  const systemOptions = systems.map((s) => ({
    value: String(s.id),
    label: `${s.name} (${s.model})`,
  }));

  const stockWarnings =
    details?.parts.filter(
      (item) =>
        item.partQuantity !== null &&
        item.partQuantity < item.quantityRequired
    ) || [];

  return (
    <div className="space-y-4">
      <Select
        label="Velg ROV-system"
        id="rov-system"
        options={systemOptions}
        value={selectedId}
        onChange={handleSelectChange}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loadingDetails && (
        <div className="flex items-center gap-2 py-4 justify-center text-stone">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Henter detaljer...</span>
        </div>
      )}

      {details && !loadingDetails && (
        <div className="space-y-4">
          {/* Bill of materials */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-terracotta" />
                <h4 className="text-sm font-medium text-near-black">
                  Materialliste ({details.parts.length} deler)
                </h4>
              </div>
            </CardHeader>
            <CardContent>
              {details.parts.length === 0 ? (
                <p className="text-sm text-stone">
                  Ingen deler registrert for dette systemet.
                </p>
              ) : (
                <div className="space-y-2">
                  {details.parts.map((item) => {
                    const isLow =
                      item.partQuantity !== null &&
                      item.partQuantity < item.quantityRequired;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between flex-wrap rounded-lg px-3 py-2 text-sm ${
                          isLow ? "bg-error/5" : "bg-warm-sand/30"
                        }`}
                      >
                        <div>
                          <span className="font-medium text-near-black">
                            {item.partName || "Ukjent del"}
                          </span>
                          {item.partSku && (
                            <span className="ml-2 text-xs text-stone">
                              {item.partSku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                          <span className="text-xs text-stone">
                            Trenger: {item.quantityRequired}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isLow ? "text-error" : "text-success"
                            }`}
                          >
                            Beholdning: {item.partQuantity ?? 0}
                          </span>
                          {isLow && (
                            <AlertTriangle className="h-3.5 w-3.5 text-error" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock warnings */}
          {stockWarnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Lagervarsel</p>
                <p className="text-xs mt-0.5">
                  {stockWarnings.length} del(er) har lavere beholdning enn
                  nødvendig antall. Automatisk bestilling opprettes ved
                  tildeling.
                </p>
              </div>
            </div>
          )}

          {/* Procedures */}
          {details.procedures.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-terracotta" />
                  <h4 className="text-sm font-medium text-near-black">
                    Tilknyttede prosedyrer ({details.procedures.length})
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {details.procedures.map((proc) => (
                    <li
                      key={proc.id}
                      className="flex items-center gap-2 text-sm text-charcoal"
                    >
                      <FileText className="h-3.5 w-3.5 text-stone" />
                      {proc.name}
                      {proc.category && (
                        <Badge className="ml-auto">{proc.category}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Drawings */}
          {details.drawings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-terracotta" />
                  <h4 className="text-sm font-medium text-near-black">
                    Tilknyttede tegninger ({details.drawings.length})
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {details.drawings.map((drawing) => (
                    <li
                      key={drawing.id}
                      className="flex items-center gap-2 text-sm text-charcoal"
                    >
                      <PenTool className="h-3.5 w-3.5 text-stone" />
                      {drawing.name}
                      <span className="ml-auto text-xs text-stone uppercase">
                        {drawing.fileType}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Assign button */}
          {!assignResult && (
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={assigning}
              className="w-full"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tildeler...
                </>
              ) : (
                "Bekreft valg"
              )}
            </Button>
          )}
        </div>
      )}

      {/* Assignment result */}
      {assignResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h4 className="text-sm font-medium text-near-black">
                ROV-system tildelt
              </h4>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parts deducted */}
            {assignResult.partsUsed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone mb-2">
                  Deler trukket fra lager:
                </p>
                <div className="space-y-1.5">
                  {assignResult.partsUsed.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-warm-sand/30 px-3 py-2 text-sm"
                    >
                      <span className="text-charcoal">
                        {p.partName || "Ukjent"}{" "}
                        <span className="text-xs text-stone">
                          x{p.quantityUsed}
                        </span>
                      </span>
                      <span className="text-xs text-stone">
                        {p.previousQuantity} &rarr; {p.newQuantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-orders created */}
            {assignResult.ordersCreated.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs font-medium text-warning">
                    Automatiske bestillinger opprettet:
                  </p>
                </div>
                <div className="space-y-1.5">
                  {assignResult.ordersCreated.map((o, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-warning/5 px-3 py-2 text-sm"
                    >
                      <span className="text-charcoal">
                        {o.partName || "Ukjent"}
                      </span>
                      <span className="text-xs text-stone">
                        Bestilt: {o.quantityOrdered} stk
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock warnings */}
            {assignResult.stockWarnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  {assignResult.stockWarnings.length} del(er) har lav beholdning
                  etter trekk.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
