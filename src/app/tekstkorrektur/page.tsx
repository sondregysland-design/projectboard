"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toaster";

export default function TekstkorrekturPage() {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCorrect() {
    if (!inputText.trim()) return;
    setLoading(true);
    setCorrectedText("");
    try {
      const res = await fetch("/api/ai/tekstkorrektur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Noe gikk galt" }));
        throw new Error(err.error || "Noe gikk galt");
      }
      const data = await res.json();
      setCorrectedText(data.corrected);
      showToast("Teksten er rettet!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ukjent feil";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(correctedText);
    showToast("Kopiert til utklippstavlen!");
  }

  function handleClear() {
    setInputText("");
    setCorrectedText("");
  }

  return (
    <div>
      <PageHeader
        title="Tekst"
        highlight="korrektur"
        subtitle="AI-drevet grammatikk- og stavekontroll for norsk tekst"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left panel - Input */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Originaltekst</h2>
            <span className="text-xs text-text-light">
              {inputText.length} tegn
            </span>
          </div>
          <textarea
            className="block w-full resize-none rounded-lg border border-gray-200 bg-surface px-4 py-3 text-sm leading-relaxed transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={16}
            placeholder="Lim inn teksten du vil korrigere..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleCorrect} disabled={loading || !inputText.trim()}>
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
                  Retter...
                </>
              ) : (
                "Rett tekst"
              )}
            </Button>
            <Button variant="secondary" onClick={handleClear} disabled={loading}>
              Tøm
            </Button>
          </div>
        </Card>

        {/* Right panel - Output */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">Rettet tekst</h2>
            {correctedText && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Kopier
              </Button>
            )}
          </div>
          <div className="min-h-[384px] rounded-lg border border-gray-200 bg-surface px-4 py-3 text-sm leading-relaxed text-text">
            {loading ? (
              <div className="flex h-full items-center justify-center py-32">
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
            ) : correctedText ? (
              <p className="whitespace-pre-wrap">{correctedText}</p>
            ) : (
              <p className="py-32 text-center text-text-light">
                Den rettede teksten vises her...
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
