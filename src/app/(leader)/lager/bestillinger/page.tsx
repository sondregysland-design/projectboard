"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";

interface PurchaseOrder {
  id: number;
  partId: number;
  partName: string | null;
  partSku: string | null;
  quantityOrdered: number;
  status: string;
  triggeredBy: string;
  supplier: string | null;
  orderDate: string | null;
  expectedDelivery: string | null;
  receivedAt: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "Ventende",
  ordered: "Bestilt",
  received: "Mottatt",
  cancelled: "Kansellert",
};

const statusBadgeClasses: Record<string, string> = {
  pending: "bg-warm-sand text-charcoal",
  ordered: "bg-coral/15 text-coral",
  received: "bg-success/15 text-success",
  cancelled: "bg-stone/15 text-stone",
};

const triggeredByLabels: Record<string, string> = {
  auto: "Automatisk",
  manual: "Manuell",
};

export default function BestillingerPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Kunne ikke hente bestillinger:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleUpdateStatus(orderId: number, newStatus: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Feil ved oppdatering");
      await fetchOrders();
    } catch (err) {
      console.error("Kunne ikke oppdatere bestilling:", err);
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/lager">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Tilbake til lager
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Bestillinger
        </h1>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster bestillinger...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-stone py-8 text-center">
              Ingen bestillinger registrert.
            </p>
          ) : (
            <>
            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-border-cream bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-near-black truncate">
                        {order.partName || "Ukjent del"}
                      </h3>
                      {order.partSku && (
                        <p className="text-xs text-stone mt-0.5">
                          {order.partSku}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusBadgeClasses[order.status] || "bg-warm-sand text-charcoal"}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-stone text-xs">Antall</span>
                      <p className="font-medium text-near-black">
                        {order.quantityOrdered}
                      </p>
                    </div>
                    <div>
                      <span className="text-stone text-xs">
                        Utl&oslash;st av
                      </span>
                      <p className="text-charcoal">
                        {triggeredByLabels[order.triggeredBy] ||
                          order.triggeredBy}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-stone text-xs">Bestillingsdato</span>
                    <p className="text-charcoal">
                      {formatDate(order.orderDate)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-cream/50">
                    {order.status === "pending" && (
                      <Button
                        variant="secondary"
                        className="w-full text-xs"
                        disabled={updating === order.id}
                        onClick={() =>
                          handleUpdateStatus(order.id, "ordered")
                        }
                      >
                        {updating === order.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Merk bestilt
                      </Button>
                    )}
                    {order.status === "ordered" && (
                      <Button
                        variant="primary"
                        className="w-full text-xs"
                        disabled={updating === order.id}
                        onClick={() =>
                          handleUpdateStatus(order.id, "received")
                        }
                      >
                        {updating === order.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Merk mottatt
                      </Button>
                    )}
                    {(order.status === "received" ||
                      order.status === "cancelled") && (
                      <span className="text-xs text-stone">
                        {order.status === "received"
                          ? "Fullf\u00f8rt"
                          : "Kansellert"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-cream text-left">
                    <th className="pb-3 pr-4 font-medium text-stone">Del</th>
                    <th className="pb-3 pr-4 font-medium text-stone">
                      SKU
                    </th>
                    <th className="pb-3 pr-4 font-medium text-stone">
                      Antall
                    </th>
                    <th className="pb-3 pr-4 font-medium text-stone">
                      Status
                    </th>
                    <th className="pb-3 pr-4 font-medium text-stone hidden md:table-cell">
                      Utl&oslash;st av
                    </th>
                    <th className="pb-3 pr-4 font-medium text-stone hidden lg:table-cell">
                      Bestillingsdato
                    </th>
                    <th className="pb-3 pr-4 font-medium text-stone hidden lg:table-cell">
                      Forventet levering
                    </th>
                    <th className="pb-3 font-medium text-stone text-right">
                      Handlinger
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border-cream/50 hover:bg-warm-sand/20 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium text-near-black">
                          {order.partName || "Ukjent del"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-charcoal">
                        {order.partSku}
                      </td>
                      <td className="py-3 pr-4 text-charcoal">
                        {order.quantityOrdered}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusBadgeClasses[order.status] || "bg-warm-sand text-charcoal"}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                        {triggeredByLabels[order.triggeredBy] ||
                          order.triggeredBy}
                      </td>
                      <td className="py-3 pr-4 text-charcoal hidden lg:table-cell">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="py-3 pr-4 text-charcoal hidden lg:table-cell">
                        {formatDate(order.expectedDelivery)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {order.status === "pending" && (
                            <Button
                              variant="secondary"
                              className="text-xs"
                              disabled={updating === order.id}
                              onClick={() =>
                                handleUpdateStatus(order.id, "ordered")
                              }
                            >
                              {updating === order.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              Merk bestilt
                            </Button>
                          )}
                          {order.status === "ordered" && (
                            <Button
                              variant="primary"
                              className="text-xs"
                              disabled={updating === order.id}
                              onClick={() =>
                                handleUpdateStatus(order.id, "received")
                              }
                            >
                              {updating === order.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              Merk mottatt
                            </Button>
                          )}
                          {(order.status === "received" ||
                            order.status === "cancelled") && (
                            <span className="text-xs text-stone">
                              {order.status === "received"
                                ? "Fullf\u00f8rt"
                                : "Kansellert"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
