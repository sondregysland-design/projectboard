"use client";

import { useRef } from "react";
import type { ProjectFile } from "@/lib/types";
import { formatFileSize, generateId } from "@/lib/utils";

interface FileAttachmentsProps {
  files: ProjectFile[];
  projectId: string;
  onFilesChange: (files: ProjectFile[]) => void;
}

export function FileAttachments({
  files,
  projectId,
  onFilesChange,
}: FileAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: ProjectFile[] = Array.from(fileList).map((f) => ({
      id: generateId(),
      name: f.name,
      size: f.size,
    }));

    onFilesChange([...files, ...newFiles]);

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(id: string) {
    onFilesChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-light">
        Vedlegg
      </p>

      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <span
            key={file.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-xs shadow-sm"
          >
            {/* PDF icon */}
            <svg
              className="h-4 w-4 flex-shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="max-w-[120px] truncate font-medium text-text">
              {file.name}
            </span>
            <span className="text-text-light">({formatFileSize(file.size)})</span>
            <button
              type="button"
              onClick={() => removeFile(file.id)}
              className="ml-0.5 text-gray-400 hover:text-red-500 transition"
              aria-label={`Fjern ${file.name}`}
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-text-light hover:border-primary hover:text-primary transition"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Last opp
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleUpload}
        className="hidden"
        data-project-id={projectId}
      />
    </div>
  );
}
