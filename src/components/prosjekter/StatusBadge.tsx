"use client";

import { useState, useRef, useEffect } from "react";
import { STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types";

const statusColors: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  workshop: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  offshore: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  invoicing: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  finished: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
};

interface StatusBadgeProps {
  status: string;
  onChange: (status: ProjectStatus) => void;
}

export function StatusBadge({ status, onChange }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const color = statusColors[status] ?? statusColors.planning;
  const label =
    STATUSES.find((s) => s.id === status)?.label ?? status;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition cursor-pointer ${color}`}
      >
        {label}
        <svg
          className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium transition hover:bg-gray-50 ${
                s.id === status ? "bg-gray-50" : ""
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
