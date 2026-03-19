"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Procedure } from "@/lib/types";
import { formatFileSize, formatNorwegianDate } from "@/lib/utils";

interface ProcedureCardProps {
  procedure: Procedure;
  onSave: (proc: Procedure) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export function ProcedureCard({
  procedure,
  onSave,
  onDelete,
  onOpen,
}: ProcedureCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(procedure.name);
  const [description, setDescription] = useState(procedure.description);
  const [url, setUrl] = useState(procedure.url);

  function handleSave() {
    onSave({ ...procedure, name, description, url });
    setEditing(false);
  }

  function handleCancel() {
    setName(procedure.name);
    setDescription(procedure.description);
    setUrl(procedure.url);
    setEditing(false);
  }

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[2px]">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navn..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskrivelse..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Lagre
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-text">{procedure.name}</h3>
          {procedure.description && (
            <p className="mt-1 text-xs text-text-light line-clamp-2">
              {procedure.description}
            </p>
          )}

          {procedure.url && (
            <a
              href={procedure.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Apne
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-text-light">
            <span>{formatFileSize(procedure.size)}</span>
            <span>{formatNorwegianDate(procedure.uploadedAt)}</span>
          </div>

          <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="secondary" onClick={() => onOpen(procedure.id)}>
              Apne PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rediger
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(procedure.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Slett
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
