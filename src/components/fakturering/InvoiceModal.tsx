"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { InvoiceUploadZone } from "./InvoiceUploadZone";
import { showToast } from "@/components/ui/Toaster";

interface InvoiceModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({
  projectId,
  projectName,
  isOpen,
  onClose,
}: InvoiceModalProps) {
  const [kabalFile, setKabalFile] = useState<File | null>(null);
  const [fraktbrevFile, setFraktbrevFile] = useState<File | null>(null);
  const [mottaksbrevFile, setMottaksbrevFile] = useState<File | null>(null);

  // Reset files when modal opens
  useEffect(() => {
    if (isOpen) {
      setKabalFile(null);
      setFraktbrevFile(null);
      setMottaksbrevFile(null);
    }
  }, [isOpen]);

  const hasAnyFile = kabalFile || fraktbrevFile || mottaksbrevFile;

  function handleMerge() {
    showToast(
      `Merge & nedlasting for "${projectName}" (${projectId}) er ikke implementert enna`
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Fakturering</h2>
            <p className="mt-0.5 text-sm text-text-light">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-text transition"
          >
            <svg
              className="h-5 w-5"
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
        </div>

        <div className="space-y-4">
          <InvoiceUploadZone
            label="Kabal Screenshot"
            type="image"
            onFile={setKabalFile}
            file={kabalFile}
            onRemove={() => setKabalFile(null)}
          />
          <InvoiceUploadZone
            label="Fraktbrev"
            type="pdf"
            onFile={setFraktbrevFile}
            file={fraktbrevFile}
            onRemove={() => setFraktbrevFile(null)}
          />
          <InvoiceUploadZone
            label="Mottaksbrev"
            type="pdf"
            onFile={setMottaksbrevFile}
            file={mottaksbrevFile}
            onRemove={() => setMottaksbrevFile(null)}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            variant="purple"
            disabled={!hasAnyFile}
            onClick={handleMerge}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Merge & Last ned PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
