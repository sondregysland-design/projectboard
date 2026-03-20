"use client";

import { useState, useEffect } from "react";
import type { Project, ProjectLink, ProjectFile } from "@/lib/types";
import { isSafeUrl } from "@/lib/utils";
import { LinksTable } from "./LinksTable";
import { FileAttachments } from "./FileAttachments";
import { InvoiceModal } from "@/components/fakturering/InvoiceModal";

interface Customer {
  id: string;
  name: string;
}

interface ProjectDetailPanelProps {
  project: Project;
  onUpdate: (field: string, value: unknown) => void;
}

export function ProjectDetailPanel({
  project,
  onUpdate,
}: ProjectDetailPanelProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    fetch("/api/kontraktpriser?type=customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch(() => setCustomers([]));
  }, []);
  function openUrl(url: string) {
    if (isSafeUrl(url)) {
      window.open(
        url.startsWith("http") ? url : `https://${url}`,
        "_blank",
        "noopener"
      );
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-gray-100 bg-gray-50/50 p-5">
      {/* Row 1: URLs and SO */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* eCompletion URL */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Custom
          </label>
          <div className="flex gap-1">
            <input
              type="url"
              value={project.ecompletionUrl}
              onChange={(e) => onUpdate("ecompletionUrl", e.target.value)}
              placeholder="URL eller tekst..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => openUrl(project.ecompletionUrl)}
              disabled={!isSafeUrl(project.ecompletionUrl)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-light hover:bg-gray-100 disabled:opacity-30 transition"
              title="Åpne Custom 1"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Kunde */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Kunde
          </label>
          <select
            value={project.bsaUrl || ""}
            onChange={(e) => onUpdate("bsaUrl", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Velg kunde...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* SO */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Sales Order
          </label>
          <input
            type="text"
            value={project.so}
            onChange={(e) => onUpdate("so", e.target.value)}
            placeholder="Sales Order..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Row 2: Checkboxes + Invoice */}
      <div className="flex flex-wrap items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={project.ce}
            onChange={(e) => onUpdate("ce", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="font-medium text-text">Cost Estimate</span>
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={project.po}
            onChange={(e) => onUpdate("po", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="font-medium text-text">Purchase Order</span>
        </label>

        <button
          type="button"
          onClick={() => setInvoiceOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition"
        >
          <svg
            className="h-3.5 w-3.5"
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
          Faktura
        </button>

        <InvoiceModal
          projectId={project.id}
          projectName={project.name || "Uten navn"}
          customerName={customers.find((c) => c.id === project.bsaUrl)?.name || ""}
          links={project.links}
          isOpen={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
        />
      </div>

      {/* Row 3: Links Table */}
      <LinksTable
        links={project.links}
        onChange={(links: ProjectLink[]) => onUpdate("links", links)}
        projectDate={project.date}
        customerId={project.bsaUrl}
      />

      {/* Row 4: File Attachments */}
      <FileAttachments
        files={project.files}
        projectId={project.id}
        onFilesChange={(files: ProjectFile[]) => onUpdate("files", files)}
      />

      {/* Row 5: Contact + Notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Kontaktperson
          </label>
          <input
            type="text"
            value={project.contactName}
            onChange={(e) => onUpdate("contactName", e.target.value)}
            placeholder="Navn..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Kontaktinfo
          </label>
          <input
            type="text"
            value={project.contactInfo}
            onChange={(e) => onUpdate("contactInfo", e.target.value)}
            placeholder="Telefon / e-post..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-light">
            Notater
          </label>
          <textarea
            value={project.notes}
            onChange={(e) => onUpdate("notes", e.target.value)}
            rows={3}
            placeholder="Notater..."
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
