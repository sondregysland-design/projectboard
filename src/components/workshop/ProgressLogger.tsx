"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface ProgressLoggerProps {
  projectId: number;
  onLogAdded: () => void;
}

const logTypeOptions = [
  { value: "started", label: "Startet" },
  { value: "progress", label: "Fremgang" },
  { value: "completed", label: "Fullf\u00f8rt" },
  { value: "issue", label: "Problem" },
];

export function ProgressLogger({
  projectId,
  onLogAdded,
}: ProgressLoggerProps) {
  const [message, setMessage] = useState("");
  const [logType, setLogType] = useState("progress");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workshop/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: message.trim(),
          logType,
        }),
      });

      if (!res.ok) {
        throw new Error("Kunne ikke legge til logg");
      }

      setMessage("");
      setLogType("progress");
      onLogAdded();
    } catch (err) {
      console.error("Feil ved logging:", err);
      setError("Kunne ikke legge til loggoppf\u00f8ring. Pr\u00f8v igjen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
      <Textarea
        label="Melding"
        id="log-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Beskriv fremdrift eller problem..."
        required
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 sm:max-w-[200px]">
          <Select
            label="Type"
            id="log-type"
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            options={logTypeOptions}
          />
        </div>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Legg til logg
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
