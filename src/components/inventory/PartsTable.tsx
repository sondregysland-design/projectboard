"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getStockStatus, STOCK_STATUS } from "@/lib/constants";
import { Pencil, Trash2 } from "lucide-react";

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

interface PartsTableProps {
  parts: Part[];
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}

const stockColorClasses: Record<string, string> = {
  ok: "text-success",
  low: "text-warning",
  critical: "text-error",
};

export function PartsTable({ parts, onEdit, onDelete }: PartsTableProps) {
  if (parts.length === 0) {
    return (
      <p className="text-sm text-stone py-8 text-center">
        Ingen deler registrert enn&aring;.
      </p>
    );
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {parts.map((part) => {
          const status = getStockStatus(part.quantity, part.minStock);
          const statusInfo = STOCK_STATUS[status];

          return (
            <div
              key={part.id}
              className="rounded-lg border border-border-cream bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-near-black truncate">
                    {part.name}
                  </h3>
                  <p className="text-xs text-stone mt-0.5">{part.sku}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color} bg-current/10`}
                >
                  <span className={statusInfo.color}>
                    {statusInfo.label}
                  </span>
                </span>
              </div>

              {part.category && (
                <div>
                  <Badge>{part.category}</Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-stone text-xs">Beholdning</span>
                  <p className={`font-semibold ${stockColorClasses[status]}`}>
                    {part.quantity} {part.unit}
                  </p>
                </div>
                <div>
                  <span className="text-stone text-xs">Min / Max</span>
                  <p className="text-charcoal">
                    {part.minStock} / {part.maxStock}
                  </p>
                </div>
              </div>

              {part.supplier && (
                <div className="text-sm">
                  <span className="text-stone text-xs">Leverand&oslash;r</span>
                  <p className="text-charcoal">{part.supplier}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border-cream/50">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => onEdit(part)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rediger
                </Button>
                <Button
                  variant="ghost"
                  className="p-2 text-error hover:text-error"
                  onClick={() => onDelete(part)}
                  title="Slett"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-cream text-left">
              <th className="pb-3 pr-4 font-medium text-stone">Navn</th>
              <th className="pb-3 pr-4 font-medium text-stone">
                SKU
              </th>
              <th className="pb-3 pr-4 font-medium text-stone hidden md:table-cell">
                Kategori
              </th>
              <th className="pb-3 pr-4 font-medium text-stone">Beholdning</th>
              <th className="pb-3 pr-4 font-medium text-stone hidden lg:table-cell">
                Min/Max
              </th>
              <th className="pb-3 pr-4 font-medium text-stone hidden lg:table-cell">
                Enhet
              </th>
              <th className="pb-3 pr-4 font-medium text-stone hidden md:table-cell">
                Leverand&oslash;r
              </th>
              <th className="pb-3 pr-4 font-medium text-stone">Status</th>
              <th className="pb-3 font-medium text-stone text-right">
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => {
              const status = getStockStatus(part.quantity, part.minStock);
              const statusInfo = STOCK_STATUS[status];

              return (
                <tr
                  key={part.id}
                  className="border-b border-border-cream/50 hover:bg-warm-sand/20 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="font-medium text-near-black">
                      {part.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-charcoal">
                    {part.sku}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    {part.category ? (
                      <Badge>{part.category}</Badge>
                    ) : (
                      <span className="text-stone">&mdash;</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`font-semibold ${stockColorClasses[status]}`}
                    >
                      {part.quantity}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-charcoal hidden lg:table-cell">
                    {part.minStock} / {part.maxStock}
                  </td>
                  <td className="py-3 pr-4 text-charcoal hidden lg:table-cell">
                    {part.unit}
                  </td>
                  <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                    {part.supplier || <span className="text-stone">&mdash;</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color} bg-current/10`}
                    >
                      <span className={statusInfo.color}>
                        {statusInfo.label}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="p-1.5"
                        onClick={() => onEdit(part)}
                        title="Rediger"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="p-1.5 text-error hover:text-error"
                        onClick={() => onDelete(part)}
                        title="Slett"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
