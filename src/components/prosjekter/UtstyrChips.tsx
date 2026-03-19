"use client";

import { useState } from "react";

interface UtstyrChipsProps {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}

export function UtstyrChips({ items, onAdd, onRemove }: UtstyrChipsProps) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="ml-0.5 text-blue-400 hover:text-blue-700 transition"
            aria-label={`Fjern ${item}`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <div className="inline-flex items-center gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Nytt utstyr..."
          className="w-28 rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white text-xs hover:bg-primary-dark transition"
          aria-label="Legg til utstyr"
        >
          +
        </button>
      </div>
    </div>
  );
}
