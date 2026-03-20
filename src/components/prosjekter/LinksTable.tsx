"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ProjectLink } from "@/lib/types";
import { isSafeUrl } from "@/lib/utils";

interface LinksTableProps {
  links: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
  projectDate: string;
  customerId?: string;
}

function emptyLink(date: string): ProjectLink {
  return { utstyr: "", date, returnDate: "", kabalUrl: "", modemUrl: "" };
}

function formatPrice(price: number, priceType: string): string {
  const formatted = price.toLocaleString("no-NO");
  return priceType === "daily" ? `${formatted} kr/dag` : `${formatted} kr fast`;
}

export function LinksTable({ links, onChange, projectDate, customerId }: LinksTableProps) {
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const lookupPrice = useCallback(
    async (index: number, equipmentName: string) => {
      if (!customerId || !equipmentName.trim()) return;
      try {
        const encodedName = encodeURIComponent(equipmentName.trim());
        const res = await fetch(
          `/api/kontraktpriser?type=lookup&customer_id=${customerId}&equipment_name=${encodedName}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.price != null && data.priceType) {
          const priceStr = formatPrice(data.price, data.priceType);
          // Update modemUrl field with price string
          onChange(
            links.map((l, i) =>
              i === index ? { ...l, modemUrl: priceStr } : l
            )
          );
        } else {
          onChange(
            links.map((l, i) =>
              i === index ? { ...l, modemUrl: "" } : l
            )
          );
        }
      } catch {
        // Silently fail — price column will show "—"
      }
    },
    [customerId, links, onChange]
  );

  function schedulePriceLookup(index: number, equipmentName: string) {
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index]);
    }
    timersRef.current[index] = setTimeout(() => {
      lookupPrice(index, equipmentName);
      delete timersRef.current[index];
    }, 500);
  }

  function update(index: number, field: keyof ProjectLink, value: string) {
    const updated = links.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    onChange(updated);

    // Schedule price lookup when utstyr changes
    if (field === "utstyr" && customerId) {
      schedulePriceLookup(index, value);
    }
  }

  function handleUtstyrBlur(index: number, equipmentName: string) {
    // Cancel any pending debounce and do immediate lookup on blur
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index]);
      delete timersRef.current[index];
    }
    if (customerId && equipmentName.trim()) {
      lookupPrice(index, equipmentName);
    }
  }

  function addRow() {
    onChange([...links, emptyLink(projectDate)]);
  }

  function removeRow(index: number) {
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index]);
      delete timersRef.current[index];
    }
    onChange(links.filter((_, i) => i !== index));
  }

  function openUrl(url: string) {
    if (isSafeUrl(url)) {
      window.open(url.startsWith("http") ? url : `https://${url}`, "_blank", "noopener");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-light">
        Utstyrslenker
      </p>

      <div className="space-y-2">
        {links.map((link, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_110px_110px_1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2"
          >
            <input
              type="text"
              value={link.utstyr}
              onChange={(e) => update(i, "utstyr", e.target.value)}
              onBlur={(e) => handleUtstyrBlur(i, e.target.value)}
              placeholder="Utstyr"
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="date"
              value={link.date}
              onChange={(e) => update(i, "date", e.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              title="Dato ut"
            />
            <input
              type="date"
              value={link.returnDate}
              onChange={(e) => update(i, "returnDate", e.target.value)}
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              title="Dato inn"
            />
            <input
              type="url"
              value={link.kabalUrl}
              onChange={(e) => update(i, "kabalUrl", e.target.value)}
              placeholder="Kabal URL"
              className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => openUrl(link.kabalUrl)}
              disabled={!isSafeUrl(link.kabalUrl)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-light hover:bg-gray-100 disabled:opacity-30 transition"
              title="Åpne Kabal"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <span
              className={`min-w-[120px] rounded-md border border-gray-100 bg-white px-2 py-1.5 text-xs text-center ${
                link.modemUrl ? "text-gray-900" : "text-gray-400"
              }`}
              title="Pris"
            >
              {link.modemUrl || "\u2014"}
            </span>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition"
              title="Fjern rad"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Legg til rad
      </button>
    </div>
  );
}
