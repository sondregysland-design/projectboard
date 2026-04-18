"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronUp, FileDown, FileText } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  rovSystemId: number | null;
  category: string | null;
  content: string | null;
  version: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProcedureListProps {
  procedures: Procedure[];
  rovSystemNames?: Record<number, string>;
}

export function ProcedureList({
  procedures,
  rovSystemNames = {},
}: ProcedureListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function toggle(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (procedures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <FileText className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen prosedyrer funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett en ny prosedyre for å komme i gang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {procedures.map((proc) => {
        const isExpanded = expandedId === proc.id;
        const rovName = proc.rovSystemId
          ? rovSystemNames[proc.rovSystemId]
          : null;

        return (
          <Card key={proc.id}>
            <button
              onClick={() => toggle(proc.id)}
              className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between gap-4 hover:bg-warm-sand/20 transition-colors rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-near-black">
                    {proc.name}
                  </span>
                  {proc.category && (
                    <Badge>{proc.category}</Badge>
                  )}
                  {proc.version && (
                    <span className="text-xs text-stone">
                      v{proc.version}
                    </span>
                  )}
                </div>
                {proc.description && (
                  <p className="text-sm text-charcoal mt-1 line-clamp-2">
                    {proc.description}
                  </p>
                )}
                {rovName && (
                  <p className="text-xs text-stone mt-1">
                    ROV: {rovName}
                  </p>
                )}
              </div>
              <div className="shrink-0 mt-1 text-stone">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </button>

            {isExpanded && (
              <CardContent className="border-t border-border-cream">
                {proc.content ? (
                  <pre className="whitespace-pre-wrap break-words text-sm text-charcoal font-sans bg-parchment rounded-lg p-3 sm:p-4 overflow-x-auto">
                    {proc.content}
                  </pre>
                ) : (
                  <p className="text-sm text-stone italic">
                    Ingen innhold tilgjengelig.
                  </p>
                )}

                {proc.fileUrl && (
                  <a
                    href={proc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-3 py-2 text-sm font-medium text-terracotta hover:text-terracotta/80 bg-warm-sand/50 hover:bg-warm-sand rounded-lg transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    Last ned / Se fil
                  </a>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
