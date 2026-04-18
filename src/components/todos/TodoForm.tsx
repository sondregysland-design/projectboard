"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export interface TodoFormData {
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
}

interface TodoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TodoFormData) => void;
}

interface Project {
  id: number;
  name: string;
}

const priorityOptions = [
  { value: "low", label: "Lav" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Høy" },
];

const defaultForm: TodoFormData = {
  title: "",
  description: "",
  projectId: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
};

export function TodoForm({ open, onClose, onSubmit }: TodoFormProps) {
  const [form, setForm] = useState<TodoFormData>(defaultForm);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      fetchProjects();
    }
  }, [open]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data);
    } catch {
      console.error("Kunne ikke hente prosjekter");
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  }

  const projectOptions = projects.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Ny oppgave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tittel *"
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Skriv inn tittel"
          required
        />

        <Textarea
          label="Beskrivelse"
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Beskriv oppgaven"
        />

        <Select
          label="Prosjekt"
          id="projectId"
          name="projectId"
          value={form.projectId}
          onChange={handleChange}
          options={projectOptions}
        />

        <Input
          label="Tildelt til"
          id="assignedTo"
          name="assignedTo"
          value={form.assignedTo}
          onChange={handleChange}
          placeholder="Navn på ansvarlig"
        />

        <Select
          label="Prioritet"
          id="priority"
          name="priority"
          value={form.priority}
          onChange={handleChange}
          options={priorityOptions}
        />

        <Input
          label="Frist"
          id="dueDate"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary">
            Opprett oppgave
          </Button>
        </div>
      </form>
    </Modal>
  );
}
