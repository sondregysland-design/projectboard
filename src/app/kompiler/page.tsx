"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toaster";
import { formatFileSize } from "@/lib/utils";

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "converting" | "done" | "error";
}

const FILE_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  doc: { color: "bg-blue-100 text-blue-700", label: "DOC" },
  docx: { color: "bg-blue-100 text-blue-700", label: "DOCX" },
  xlsx: { color: "bg-green-100 text-green-700", label: "XLSX" },
  pptx: { color: "bg-orange-100 text-orange-700", label: "PPTX" },
};

const ACCEPTED_EXTENSIONS = [".doc", ".docx", ".xlsx", ".pptx"];

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export default function KompilerPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: FileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = "." + getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        showToast(`Filtype ${ext} er ikke støttet`);
        continue;
      }
      newFiles.push({
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: getFileExtension(file.name),
        status: "pending",
      });
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleConvertAll() {
    // Placeholder conversion - simulate processing
    for (const file of files) {
      if (file.status !== "pending") continue;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "converting" as const } : f
        )
      );
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "done" as const } : f
        )
      );
    }
    showToast("Konvertering krever ytterligere biblioteker");
  }

  function handleDownloadAll() {
    showToast("Konvertering krever ytterligere biblioteker");
  }

  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasPending = files.some((f) => f.status === "pending");
  const isConverting = files.some((f) => f.status === "converting");

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Venter", color: "text-text-light" },
    converting: { label: "Konverterer...", color: "text-primary" },
    done: { label: "Ferdig", color: "text-green-600" },
    error: { label: "Feil", color: "text-red-600" },
  };

  return (
    <div>
      <PageHeader
        title="Kom"
        highlight="piler"
        subtitle="Konverter dokumenter til PDF"
      />

      <div className="mx-auto max-w-3xl">
        {/* Drop zone */}
        <Card className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-6 py-12 transition hover:border-primary hover:bg-primary/5"
          >
            <svg
              className="mb-3 h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-text">
              Dra og slipp filer her
            </p>
            <p className="mt-1 text-xs text-text-light">
              .doc, .docx, .xlsx, .pptx
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx,.xlsx,.pptx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </Card>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file) => {
              const typeConfig =
                FILE_TYPE_CONFIG[file.type] ?? FILE_TYPE_CONFIG.docx;
              const status = statusConfig[file.status];
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  {/* Type icon */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${typeConfig.color}`}
                  >
                    {typeConfig.label}
                  </div>

                  {/* File info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${status.color}`}>
                      {file.status === "converting" && (
                        <svg
                          className="mr-1 inline h-3 w-3 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                      {file.status === "done" && (
                        <svg
                          className="mr-1 inline h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {status.label}
                    </span>

                    {file.status === "pending" && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-text-light transition hover:text-red-500"
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
                </div>
              );
            })}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3">
              {hasPending && (
                <Button onClick={handleConvertAll} disabled={isConverting}>
                  {isConverting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Konverterer...
                    </>
                  ) : (
                    "Kompiler alle"
                  )}
                </Button>
              )}
              {allDone && (
                <Button onClick={handleDownloadAll}>
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Last ned alle (ZIP)
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setFiles([])}
                disabled={isConverting}
              >
                Tøm liste
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
