"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { Trash2, CheckSquare, Calendar } from "lucide-react";

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

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (id: number, currentStatus: string) => void;
  onDelete: (id: number) => void;
  projectNames?: Record<number, string>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dateStr: string | null, status: string): boolean {
  if (!dateStr || status === "completed") return false;
  return new Date(dateStr) < new Date();
}

export function TodoList({
  todos,
  onToggleComplete,
  onDelete,
  projectNames = {},
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <CheckSquare className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen gjøremål funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett en ny oppgave for å komme i gang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => {
        const isCompleted = todo.status === "completed";
        const overdue = isOverdue(todo.dueDate, todo.status);
        const projectName = todo.projectId
          ? projectNames[todo.projectId]
          : null;

        return (
          <Card
            key={todo.id}
            className={isCompleted ? "opacity-60" : ""}
          >
            <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => onToggleComplete(todo.id, todo.status)}
                className={`mt-0.5 shrink-0 w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? "bg-success border-success text-white"
                    : "border-stone hover:border-terracotta"
                }`}
                aria-label={
                  isCompleted ? "Marker som uferdig" : "Marker som fullført"
                }
              >
                {isCompleted && (
                  <svg
                    className="w-4 h-4 sm:w-3 sm:h-3"
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
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium ${
                      isCompleted
                        ? "line-through text-stone"
                        : "text-near-black"
                    }`}
                  >
                    {todo.title}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      PRIORITY_COLORS[todo.priority] || ""
                    }`}
                  >
                    {PRIORITY_LABELS[todo.priority] || todo.priority}
                  </span>
                </div>

                {todo.description && (
                  <p className="text-sm text-charcoal mt-1 line-clamp-1">
                    {todo.description}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {projectName && (
                    <span className="text-xs text-olive bg-warm-sand px-2 py-0.5 rounded">
                      {projectName}
                    </span>
                  )}
                  {todo.assignedTo && (
                    <span className="text-xs text-stone">
                      {todo.assignedTo}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        overdue ? "text-error font-medium" : "text-stone"
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {formatDate(todo.dueDate)}
                      {overdue && " (forfalt)"}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                className="shrink-0 p-1.5 text-stone hover:text-error"
                onClick={() => onDelete(todo.id)}
                aria-label="Slett gjøremål"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
