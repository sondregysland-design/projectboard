"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Wrench } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleLogin(role: "leader" | "workshop") {
    setLoading(role);
    try {
      const isIframe = window.self !== window.top;

      if (isIframe) {
        // Third-party cookies are blocked in iframes — open in new tab
        window.open(
          `/api/auth/login-redirect?role=${role}`,
          "_blank"
        );
        setLoading(null);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(role === "leader" ? "/prosjekter" : "/verksted");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-near-black">
            Prosjektstyring
          </h1>
          <p className="mt-2 text-olive">Velg din rolle</p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Leader card */}
          <button
            onClick={() => handleLogin("leader")}
            disabled={loading !== null}
            className="group flex flex-col items-center gap-4 rounded-xl border border-border-cream bg-ivory p-6 transition-all hover:border-terracotta hover:shadow-md disabled:opacity-60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-white">
              <FolderKanban className="h-7 w-7" />
            </div>
            <div>
              <p className="font-medium text-near-black">Prosjektleder</p>
              <p className="mt-1 text-xs text-stone">
                Prosjekter, prosedyrer, gjøremål og lager
              </p>
            </div>
            {loading === "leader" && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
            )}
          </button>

          {/* Workshop card */}
          <button
            onClick={() => handleLogin("workshop")}
            disabled={loading !== null}
            className="group flex flex-col items-center gap-4 rounded-xl border border-border-cream bg-ivory p-6 transition-all hover:border-coral hover:shadow-md disabled:opacity-60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-coral/10 text-coral transition-colors group-hover:bg-coral group-hover:text-white">
              <Wrench className="h-7 w-7" />
            </div>
            <div>
              <p className="font-medium text-near-black">Verksted</p>
              <p className="mt-1 text-xs text-stone">
                Verkstedoversikt og oppgaver
              </p>
            </div>
            {loading === "workshop" && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-coral border-t-transparent" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
