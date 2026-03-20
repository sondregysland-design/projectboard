"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toaster";
import { generateId } from "@/lib/utils";
import type { Customer, Equipment, ContractPrice } from "@/lib/types";

function formatNOK(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function parseNOK(value: string): number {
  return Number(value.replace(/\s/g, "")) || 0;
}

type ActiveTab = "customers" | "equipment" | "prices";

export default function KontraktpriserPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("customers");

  // --- Customers ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  // --- Equipment ---
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [newEquip, setNewEquip] = useState({
    name: "",
    standardPrice: "",
    priceType: "daily" as "daily" | "fixed",
  });

  // --- Prices ---
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [prices, setPrices] = useState<ContractPrice[]>([]);
  const [editingPrices, setEditingPrices] = useState<
    Record<string, { price: string; priceType: "daily" | "fixed" }>
  >({});

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/kontraktpriser?type=customers");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data);
    } catch {
      showToast("Kunne ikke hente kunder");
    }
  }, []);

  // Fetch equipment
  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch("/api/kontraktpriser?type=equipment");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEquipment(data);
    } catch {
      showToast("Kunne ikke hente utstyr");
    }
  }, []);

  // Fetch prices for selected customer
  const fetchPrices = useCallback(async (customerId: string) => {
    if (!customerId) {
      setPrices([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/kontraktpriser?type=prices&customer_id=${customerId}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrices(data);
    } catch {
      showToast("Kunne ikke hente priser");
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchEquipment();
  }, [fetchCustomers, fetchEquipment]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPrices(selectedCustomerId);
      setEditingPrices({});
    }
  }, [selectedCustomerId, fetchPrices]);

  // --- Customer handlers ---
  async function handleAddCustomer() {
    const name = newCustomerName.trim();
    if (!name) return;
    const id = generateId();
    try {
      const res = await fetch("/api/kontraktpriser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "customer", id, name }),
      });
      if (!res.ok) throw new Error();
      showToast("Kunde lagt til");
      setNewCustomerName("");
      setAddingCustomer(false);
      fetchCustomers();
    } catch {
      showToast("Kunne ikke legge til kunde");
    }
  }

  async function handleDeleteCustomer(id: string) {
    try {
      const res = await fetch(
        `/api/kontraktpriser?type=customer&id=${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      showToast("Kunde slettet");
      fetchCustomers();
      if (selectedCustomerId === id) {
        setSelectedCustomerId("");
        setPrices([]);
      }
    } catch {
      showToast("Kunne ikke slette kunde");
    }
  }

  // --- Equipment handlers ---
  async function handleAddEquipment() {
    const name = newEquip.name.trim();
    const standardPrice = parseNOK(newEquip.standardPrice);
    if (!name || standardPrice <= 0) return;
    const id = generateId();
    try {
      const res = await fetch("/api/kontraktpriser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "equipment",
          id,
          name,
          standardPrice,
          priceType: newEquip.priceType,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Utstyr lagt til");
      setNewEquip({ name: "", standardPrice: "", priceType: "daily" });
      setAddingEquipment(false);
      fetchEquipment();
    } catch {
      showToast("Kunne ikke legge til utstyr");
    }
  }

  async function handleDeleteEquipment(id: string) {
    try {
      const res = await fetch(
        `/api/kontraktpriser?type=equipment&id=${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      showToast("Utstyr slettet");
      fetchEquipment();
    } catch {
      showToast("Kunne ikke slette utstyr");
    }
  }

  // --- Price handlers ---
  function handlePriceEdit(
    equipmentId: string,
    field: "price" | "priceType",
    value: string
  ) {
    setEditingPrices((prev) => {
      const existing = prev[equipmentId] ?? { price: "", priceType: "daily" };
      return {
        ...prev,
        [equipmentId]: { ...existing, [field]: value },
      };
    });
  }

  async function handleSavePrice(equipmentId: string) {
    const edit = editingPrices[equipmentId];
    if (!edit || !selectedCustomerId) return;
    const price = parseNOK(edit.price);
    if (price <= 0) return;

    const existingPrice = prices.find((p) => p.equipmentId === equipmentId);
    const id = existingPrice?.id ?? generateId();

    try {
      const res = await fetch("/api/kontraktpriser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "price",
          id,
          customerId: selectedCustomerId,
          equipmentId,
          price,
          priceType: edit.priceType,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Pris lagret");
      fetchPrices(selectedCustomerId);
      setEditingPrices((prev) => {
        const next = { ...prev };
        delete next[equipmentId];
        return next;
      });
    } catch {
      showToast("Kunne ikke lagre pris");
    }
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "customers", label: "Kunder" },
    { key: "equipment", label: "Standard Utstyr" },
    { key: "prices", label: "Kundespesifikke Priser" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Kontrakt"
        highlight="priser"
        subtitle="Administrer kunder, utstyr og priser"
      />

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === CUSTOMERS === */}
      {activeTab === "customers" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Kunder</h2>
            <Button
              size="sm"
              onClick={() => setAddingCustomer(true)}
            >
              Legg til kunde
            </Button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3 text-right">Slett</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 text-text">{c.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomer(c.id)}
                    >
                      Slett
                    </Button>
                  </td>
                </tr>
              ))}

              {addingCustomer && (
                <tr className="border-b border-gray-50 bg-blue-50/30">
                  <td className="px-4 py-3">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Kundenavn"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustomer();
                        if (e.key === "Escape") {
                          setAddingCustomer(false);
                          setNewCustomerName("");
                        }
                      }}
                      className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={handleAddCustomer}>
                        Lagre
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingCustomer(false);
                          setNewCustomerName("");
                        }}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {customers.length === 0 && !addingCustomer && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Ingen kunder lagt til enda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* === EQUIPMENT === */}
      {activeTab === "equipment" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Standard Utstyr</h2>
            <Button
              size="sm"
              onClick={() => setAddingEquipment(true)}
            >
              Legg til utstyr
            </Button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Utstyr</th>
                <th className="px-4 py-3">Standardpris (NOK)</th>
                <th className="px-4 py-3">Pristype</th>
                <th className="px-4 py-3 text-right">Slett</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr
                  key={eq.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 text-text">{eq.name}</td>
                  <td className="px-4 py-3 text-text">
                    {formatNOK(eq.standardPrice)}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {eq.priceType === "daily" ? "Dagrate" : "Fastpris"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEquipment(eq.id)}
                    >
                      Slett
                    </Button>
                  </td>
                </tr>
              ))}

              {addingEquipment && (
                <tr className="border-b border-gray-50 bg-blue-50/30">
                  <td className="px-4 py-3">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Utstyrsnavn"
                      value={newEquip.name}
                      onChange={(e) =>
                        setNewEquip((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddEquipment();
                        if (e.key === "Escape") {
                          setAddingEquipment(false);
                          setNewEquip({
                            name: "",
                            standardPrice: "",
                            priceType: "daily",
                          });
                        }
                      }}
                      className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="Pris"
                      value={newEquip.standardPrice}
                      onChange={(e) =>
                        setNewEquip((prev) => ({
                          ...prev,
                          standardPrice: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddEquipment();
                      }}
                      className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={newEquip.priceType}
                      onChange={(e) =>
                        setNewEquip((prev) => ({
                          ...prev,
                          priceType: e.target.value as "daily" | "fixed",
                        }))
                      }
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="daily">Dagrate</option>
                      <option value="fixed">Fastpris</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={handleAddEquipment}>
                        Lagre
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingEquipment(false);
                          setNewEquip({
                            name: "",
                            standardPrice: "",
                            priceType: "daily",
                          });
                        }}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {equipment.length === 0 && !addingEquipment && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Ingen utstyr lagt til enda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* === CUSTOMER-SPECIFIC PRICES === */}
      {activeTab === "prices" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              Kundespesifikke Priser
            </h2>
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Velg kunde
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Velg kunde --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerId ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Utstyr</th>
                  <th className="px-4 py-3">Standardpris</th>
                  <th className="px-4 py-3">Kundepris</th>
                  <th className="px-4 py-3">Pristype</th>
                  <th className="px-4 py-3 text-right">Lagre</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((eq) => {
                  const cp = prices.find((p) => p.equipmentId === eq.id);
                  const editing = editingPrices[eq.id];
                  const displayPrice = editing
                    ? editing.price
                    : cp
                      ? formatNOK(cp.price)
                      : "";
                  const displayType = editing
                    ? editing.priceType
                    : cp
                      ? cp.priceType
                      : eq.priceType;
                  const hasCustomPrice = !!cp && !editing;

                  return (
                    <tr
                      key={eq.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-text">{eq.name}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatNOK(eq.standardPrice)}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            type="text"
                            value={editing.price}
                            onChange={(e) =>
                              handlePriceEdit(eq.id, "price", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePrice(eq.id);
                            }}
                            className="w-32 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              handlePriceEdit(eq.id, "price", cp ? String(cp.price) : "")
                            }
                            className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 ${
                              hasCustomPrice
                                ? "font-medium text-text"
                                : "text-gray-400 italic"
                            }`}
                          >
                            {hasCustomPrice
                              ? formatNOK(cp.price)
                              : formatNOK(eq.standardPrice)}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <select
                            value={displayType}
                            onChange={(e) =>
                              handlePriceEdit(
                                eq.id,
                                "priceType",
                                e.target.value
                              )
                            }
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="daily">Dagrate</option>
                            <option value="fixed">Fastpris</option>
                          </select>
                        ) : (
                          <span
                            className={
                              hasCustomPrice ? "text-text" : "text-gray-400"
                            }
                          >
                            {displayType === "daily" ? "Dagrate" : "Fastpris"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editing && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSavePrice(eq.id)}
                            >
                              Lagre
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingPrices((prev) => {
                                  const next = { ...prev };
                                  delete next[eq.id];
                                  return next;
                                })
                              }
                            >
                              Avbryt
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {equipment.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Legg til utstyr i &quot;Standard Utstyr&quot;-fanen forst
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-gray-400">
              Velg en kunde for a se og redigere priser
            </p>
          )}
        </div>
      )}
    </main>
  );
}
