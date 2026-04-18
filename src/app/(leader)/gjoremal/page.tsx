"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TodoList } from "@/components/todos/TodoList";
import { TodoForm, type TodoFormData } from "@/components/todos/TodoForm";
import { TODO_STATUS_LABELS } from "@/lib/constants";
import { Plus, Loader2 } from "lucide-react";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  projectId: number | null;
  assignedTo: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
}

const statusFilterOptions = [
  { value: "", label: "Alle" },
  ...Object.entries(TODO_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const priorityFilterOptions = [
  { value: "", label: "Alle" },
  { value: "low", label: "Lav" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Høy" },
];

function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    // Completed items go to the bottom
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    // Sort by due date (nulls last)
    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (diff !== 0) return diff;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Then by priority
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error("Kunne ikke hente gjøremål:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data);
    } catch {
      console.error("Kunne ikke hente prosjekter");
    }
  }, []);

  useEffect(() => {
    fetchTodos();
    fetchProjects();
  }, [fetchTodos, fetchProjects]);

  const projectNames: Record<number, string> = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of projects) {
      map[p.id] = p.name;
    }
    return map;
  }, [projects]);

  const filteredTodos = useMemo(() => {
    let result = todos;
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return sortTodos(result);
  }, [todos, statusFilter, priorityFilter]);

  async function handleToggleComplete(id: number, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Feil");
      await fetchTodos();
    } catch (err) {
      console.error("Kunne ikke oppdatere gjøremål:", err);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Feil");
      await fetchTodos();
    } catch (err) {
      console.error("Kunne ikke slette gjøremål:", err);
    }
  }

  async function handleCreateTodo(data: TodoFormData) {
    try {
      const body: Record<string, unknown> = {
        title: data.title,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        priority: data.priority,
        dueDate: data.dueDate || null,
        projectId: data.projectId ? parseInt(data.projectId, 10) : null,
      };

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Feil ved opprettelse");
      setFormOpen(false);
      await fetchTodos();
    } catch (err) {
      console.error("Kunne ikke opprette gjøremål:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Gjøremål
        </h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Ny oppgave
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select
            label="Status"
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Prioritet"
            id="priorityFilter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={priorityFilterOptions}
          />
        </div>
      </div>

      {/* Todo list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Laster gjøremål...
        </div>
      ) : (
        <TodoList
          todos={filteredTodos}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
          projectNames={projectNames}
        />
      )}

      {/* Create todo modal */}
      <TodoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateTodo}
      />
    </div>
  );
}
