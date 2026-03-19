"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toaster";
import { ANALYSE_PRESETS } from "@/lib/constants";
import { formatFileSize } from "@/lib/utils";

type PresetKey = keyof typeof ANALYSE_PRESETS;

export default function PdfAnalysePage() {
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    []
  );

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Kun PDF-filer er støttet");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setExtracting(true);
    setResult("");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => (item.str ?? ""))
          .join(" ");
        fullText += `\n--- Side ${i} ---\n${pageText}`;
      }

      setPdfText(fullText.trim());
      showToast(`Tekst hentet fra ${pdf.numPages} sider`);
    } catch (err) {
      console.error("PDF extraction error:", err);
      showToast("Kunne ikke lese PDF-filen");
      setPdfText("");
    } finally {
      setExtracting(false);
    }
  }

  function getActivePrompt(): string {
    if (!selectedPreset) return "";
    if (selectedPreset === "custom") return customPrompt;
    return ANALYSE_PRESETS[selectedPreset].prompt;
  }

  async function handleAnalyse() {
    const prompt = getActivePrompt();
    if (!pdfText.trim() || !prompt.trim()) return;

    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/pdf-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText, prompt, fileName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Noe gikk galt" }));
        throw new Error(err.error || "Noe gikk galt");
      }
      const data = await res.json();
      setResult(data.result);
      showToast("Analyse fullført!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ukjent feil";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    showToast("Kopiert til utklippstavlen!");
  }

  function handleExportExcel() {
    try {
      const parsed = JSON.parse(result);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) {
        showToast("Ingen data å eksportere");
        return;
      }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join("\t"),
        ...rows.map((r: Record<string, unknown>) =>
          headers.map((h) => String(r[h] ?? "")).join("\t")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/tab-separated-values" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(".pdf", "")}_analyse.tsv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Excel-fil lastet ned");
    } catch {
      showToast("Resultatet er ikke i tabellformat");
    }
  }

  function tryParseJson(text: string): unknown | null {
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  function renderResult() {
    if (!result) return null;

    const parsed = tryParseJson(result);

    // JSON array -> table
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      const headers = Object.keys(parsed[0] as Record<string, unknown>);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold text-text"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-text-light">
                      {String((row as Record<string, unknown>)[h] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // JSON object (inquiry checklist) -> structured form
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return (
        <div className="space-y-4">
          {Object.entries(parsed as Record<string, unknown>).map(([section, value]) => (
            <div key={section}>
              <h3 className="mb-2 text-sm font-semibold capitalize text-text">
                {section.replace(/_/g, " ")}
              </h3>
              {typeof value === "object" && value !== null && !Array.isArray(value) ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-md border border-gray-100 px-3 py-2"
                    >
                      <span className="text-xs text-text-light">
                        {k.replace(/_/g, " ")}
                      </span>
                      <p className="text-sm font-medium text-text">
                        {v !== null && v !== undefined ? String(v) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(value) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {value.length > 0 &&
                          Object.keys(value[0] as Record<string, unknown>).map((h) => (
                            <th
                              key={h}
                              className="px-3 py-1 text-left text-xs font-semibold text-text"
                            >
                              {h.replace(/_/g, " ")}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {value.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          {Object.values(row as Record<string, unknown>).map((v, j) => (
                            <td key={j} className="px-3 py-1 text-text-light">
                              {v !== null && v !== undefined ? String(v) : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-light">{String(value ?? "—")}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Raw text
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{result}</p>;
  }

  return (
    <div>
      <PageHeader
        title="PDF-"
        highlight="analyse"
        subtitle="Last opp brønndokumenter for AI-drevet analyse"
      />

      {/* Top section: Upload + Presets side by side */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload zone */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text">
            1. Last opp PDF
          </h2>
          {!pdfText ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-6 py-12 transition hover:border-primary hover:bg-primary/5"
            >
              {extracting ? (
                <>
                  <svg
                    className="mb-3 h-8 w-8 animate-spin text-primary"
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
                  <p className="text-sm text-text-light">Leser PDF...</p>
                </>
              ) : (
                <>
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
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-text">
                    Dra og slipp PDF her
                  </p>
                  <p className="mt-1 text-xs text-text-light">
                    eller klikk for å velge fil
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{fileName}</p>
                    <p className="text-xs text-text-light">
                      {formatFileSize(fileSize)} &middot;{" "}
                      {pdfText.length.toLocaleString()} tegn ekstrahert
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPdfText("");
                    setFileName("");
                    setFileSize(0);
                    setResult("");
                  }}
                >
                  Fjern
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Preset selection */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text">
            2. Velg analysetype
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ANALYSE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setSelectedPreset(key as PresetKey)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedPreset === key
                    ? "bg-primary text-white shadow-sm"
                    : "border border-gray-200 bg-white text-text hover:bg-gray-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedPreset === "custom" && (
            <textarea
              className="mt-3 block w-full resize-none rounded-lg border border-gray-200 bg-surface px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={4}
              placeholder="Skriv din egendefinerte analyse-prompt..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
          )}

          <div className="mt-4">
            <Button
              onClick={handleAnalyse}
              disabled={
                loading || !pdfText.trim() || !getActivePrompt().trim()
              }
            >
              {loading ? (
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
                  Analyserer...
                </>
              ) : (
                "Analyser med AI"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Results section */}
      {(result || loading) && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">3. Resultater</h2>
            {result && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  Kopier
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportExcel}>
                  Eksporter Excel
                </Button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="h-8 w-8 animate-spin text-primary"
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
            </div>
          ) : (
            renderResult()
          )}
        </Card>
      )}
    </div>
  );
}
