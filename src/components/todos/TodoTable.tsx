"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toaster";
import type { Todo } from "@/lib/types";
import { generateId } from "@/lib/utils";

export function TodoTable() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const newRowRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setTodos(data);
    } catch {
      showToast("Kunne ikke hente oppgaver");
    } finally {
      setLoading(false);
    }
  }

  async function addTodo() {
    const newTodo: Todo = {
      id: generateId(),
      task: "",
      category: "",
      status: "pending",
      dueDate: "",
    };
    setTodos((prev) => [...prev, newTodo]);
    setTimeout(() => newRowRef.current?.focus(), 50);

    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });
    } catch {
      showToast("Kunne ikke opprette oppgave");
    }
  }

  async function updateTodo(id: string, field: keyof Todo, value: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

    try {
      await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
    } catch {
      showToast("Kunne ikke oppdatere oppgave");
    }
  }

  async function completeTodo(id: string) {
    setFadingOut((prev) => new Set(prev).add(id));

    setTimeout(async () => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setFadingOut((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      try {
        await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
        showToast("Oppgave fullfort");
      } catch {
        showToast("Kunne ikke slette oppgave");
      }
    }, 400);
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
      showToast("Oppgave slettet");
    } catch {
      showToast("Kunne ikke slette oppgave");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-text-light">
        Laster oppgaver...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-text-light">
            <th className="w-10 px-4 py-3"></th>
            <th className="w-12 px-2 py-3">#</th>
            <th className="px-4 py-3">Oppgave</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="w-40 px-4 py-3">Frist</th>
            <th className="w-12 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo, idx) => (
            <tr
              key={todo.id}
              className={`border-b border-gray-50 transition-all duration-300 hover:bg-gray-50 ${
                fadingOut.has(todo.id)
                  ? "opacity-0 translate-x-4"
                  : "opacity-100"
              }`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  onChange={() => completeTodo(todo.id)}
                />
              </td>
              <td className="px-2 py-3 text-text-light">{idx + 1}</td>
              <td className="px-4 py-3">
                <input
                  ref={idx === todos.length - 1 ? newRowRef : null}
                  type="text"
                  value={todo.task}
                  onChange={(e) => updateTodo(todo.id, "task", e.target.value)}
                  onBlur={(e) => updateTodo(todo.id, "task", e.target.value)}
                  placeholder="Skriv oppgave..."
                  className="w-full bg-transparent border-none outline-none text-sm text-text placeholder:text-gray-300 focus:ring-0 p-0"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={todo.category}
                  onChange={(e) =>
                    updateTodo(todo.id, "category", e.target.value)
                  }
                  onBlur={(e) =>
                    updateTodo(todo.id, "category", e.target.value)
                  }
                  placeholder="Kategori..."
                  className="w-full bg-transparent border-none outline-none text-sm text-text placeholder:text-gray-300 focus:ring-0 p-0"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="date"
                  value={todo.dueDate}
                  onChange={(e) =>
                    updateTodo(todo.id, "dueDate", e.target.value)
                  }
                  className="bg-transparent border-none outline-none text-sm text-text focus:ring-0 p-0"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-500 transition"
                  title="Slett"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {todos.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-sm text-text-light"
              >
                Ingen oppgaver enda. Legg til din forste!
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-gray-50 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={addTodo}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Legg til ny oppgave
        </Button>
      </div>
    </div>
  );
}
