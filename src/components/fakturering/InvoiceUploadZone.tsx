"use client";

import { useRef } from "react";
import { formatFileSize } from "@/lib/utils";

interface InvoiceUploadZoneProps {
  label: string;
  type: "pdf" | "image";
  onFile: (file: File) => void;
  file?: File | null;
  onRemove?: () => void;
}

export function InvoiceUploadZone({
  label,
  type,
  onFile,
  file,
  onRemove,
}: InvoiceUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === "pdf" ? ".pdf" : "image/*";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) onFile(selected);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-light">
        {label}
      </p>

      {file ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="h-4 w-4 flex-shrink-0 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">
                {file.name}
              </p>
              <p className="text-xs text-text-light">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500 transition"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-sm text-text-light transition hover:border-gray-300 hover:bg-gray-50"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.438 3.168A3.75 3.75 0 0118 19.5H6.75z"
            />
          </svg>
          Velg {type === "pdf" ? "PDF" : "bilde"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
