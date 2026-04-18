"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Copy, Check } from "lucide-react";

export default function RettskrivingPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleProofread() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error("Feil ved korrekturlesing");
      const data = await res.json();
      setOutput(data.corrected);
    } catch (err) {
      console.error("Korrekturlesing feilet:", err);
      setOutput("Kunne ikke korrigere teksten. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Rettskriving
        </h1>
        <p className="text-sm text-stone mt-1">
          Lim inn tekst for korrekturlesing. Språket beholdes automatisk.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Tekst å korrigere
            </label>
            <Textarea
              placeholder="Lim inn teksten her..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              className="text-sm"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleProofread}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Retter...
              </>
            ) : (
              "Rett tekst"
            )}
          </Button>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-charcoal">
                  Korrigert tekst
                </label>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Kopier
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-lg border border-border-cream bg-ivory p-4 text-sm text-near-black whitespace-pre-wrap">
                {output}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
