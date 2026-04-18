"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Archive, Loader2 } from "lucide-react";

interface ArchivedProject {
  id: number;
  name: string;
  client: string;
  location: string | null;
  completedAt: string | null;
}

export default function ArkivPage() {
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCompleted() {
      try {
        const res = await fetch("/api/projects?status=completed");
        if (!res.ok) throw new Error("Feil");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Kunne ikke hente arkiverte prosjekter:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompleted();
  }, []);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-near-black">Arkiv</h1>
      <p className="text-sm text-stone">
        Fullførte prosjekter flyttes hit automatisk.
      </p>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster arkiv...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-warm-sand p-4 mb-4">
                <Archive className="h-8 w-8 text-stone" />
              </div>
              <p className="text-lg font-medium text-charcoal">
                Ingen fullførte prosjekter
              </p>
              <p className="text-sm text-stone mt-1">
                Prosjekter med status &quot;Fullført&quot; vises her.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="sm:hidden space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/prosjekter/${p.id}`)}
                    className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
                  >
                    <p className="font-medium text-near-black">{p.name}</p>
                    <p className="text-xs text-charcoal mt-0.5">{p.client}</p>
                    <p className="text-xs text-stone mt-1">
                      Fullført: {formatDate(p.completedAt)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-cream text-left">
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Prosjekt
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Klient
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                        Lokasjon
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Fullført
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/prosjekter/${p.id}`)}
                        className="border-b border-border-cream last:border-b-0 cursor-pointer hover:bg-warm-sand/30 transition-colors"
                      >
                        <td className="py-3 pr-4 font-medium text-near-black">
                          {p.name}
                        </td>
                        <td className="py-3 pr-4 text-charcoal">{p.client}</td>
                        <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                          {p.location || "—"}
                        </td>
                        <td className="py-3 text-charcoal">
                          {formatDate(p.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
