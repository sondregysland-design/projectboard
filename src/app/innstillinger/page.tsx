"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toaster";

interface ApiKeyCardProps {
  title: string;
  description: string;
  storageKey: string;
}

function ApiKeyCard({ title, description, storageKey }: ApiKeyCardProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setValue(stored);
      setSaved(true);
    }
  }, [storageKey]);

  function handleSave() {
    if (!value.trim()) {
      showToast("API-nøkkel kan ikke være tom");
      return;
    }
    localStorage.setItem(storageKey, value.trim());
    setSaved(true);
    showToast(`${title} lagret`);
  }

  function handleRemove() {
    localStorage.removeItem(storageKey);
    setValue("");
    setSaved(false);
    setVisible(false);
    showToast(`${title} fjernet`);
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      <p className="mt-1 mb-4 text-xs text-text-light">{description}</p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            placeholder="sk-..."
            className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm font-mono transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
          >
            {visible ? (
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
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
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
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
        <Button onClick={handleSave} disabled={!value.trim()}>
          Lagre
        </Button>
        {saved && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            Fjern
          </Button>
        )}
      </div>

      {saved && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <svg
            className="h-3 w-3"
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
          Nøkkel lagret
        </p>
      )}
    </Card>
  );
}

export default function InnstillingerPage() {
  return (
    <div>
      <PageHeader
        title="Innstil"
        highlight="linger"
        subtitle="Administrer API-nøkler og konfigurasjon"
      />

      <div className="mx-auto max-w-[600px] space-y-6">
        <ApiKeyCard
          title="OpenAI API-nøkkel"
          description="Brukes for tekstkorrektur og PDF-analyse. Hentes fra platform.openai.com."
          storageKey="projectboard_openai_key"
        />

        <ApiKeyCard
          title="ConvertAPI-nøkkel"
          description="Brukes for dokumentkonvertering til PDF. Hentes fra convertapi.com."
          storageKey="projectboard_convertapi_key"
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Om API-nøkler
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-700">
                Nøklene lagres lokalt i nettleseren din og sendes kun til
                server-side API-ruter for sikker bruk. De deles aldri med
                tredjeparter. For produksjonsmiljøer anbefales det å konfigurere
                nøklene som miljøvariabler på serveren.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
