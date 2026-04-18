"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WorkshopFeed } from "@/components/workshop/WorkshopFeed";
import { Loader2 } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  category: string | null;
}

interface Drawing {
  id: number;
  name: string;
  fileType: string;
}

interface WorkshopProject {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemId: number | null;
  rovSystemName: string | null;
  rovSystemModel: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  procedures: Procedure[];
  drawings: Drawing[];
}

export default function VerkstedPage() {
  const [projects, setProjects] = useState<WorkshopProject[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/workshop/feed");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Kunne ikke hente verkstedprosjekter:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();

    intervalRef.current = setInterval(fetchProjects, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Verksted
        </h1>
        <span className="text-xs text-stone">
          Oppdateres automatisk hvert 30. sekund
        </span>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-stone">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Laster verkstedprosjekter...
        </div>
      ) : (
        <WorkshopFeed projects={projects} />
      )}
    </div>
  );
}
