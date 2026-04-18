"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export interface ProjectFormData {
  name: string;
  client: string;
  location: string;
  description: string;
  priority: string;
  assignedTo: string;
  startDate: string;
  dueDate: string;
}

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData>;
}

const priorityOptions = [
  { value: "low", label: "Lav" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Høy" },
  { value: "critical", label: "Kritisk" },
];

const defaultForm: ProjectFormData = {
  name: "",
  client: "",
  location: "",
  description: "",
  priority: "medium",
  assignedTo: "",
  startDate: "",
  dueDate: "",
};

export function ProjectForm({
  open,
  onClose,
  onSubmit,
  initialData,
}: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...initialData });
    }
  }, [open, initialData]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.client.trim()) return;
    onSubmit(form);
  }

  const isEditing = !!initialData;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Rediger prosjekt" : "Nytt prosjekt"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Prosjektnavn *"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Skriv inn prosjektnavn"
          required
        />

        <Input
          label="Klient *"
          id="client"
          name="client"
          value={form.client}
          onChange={handleChange}
          placeholder="Kundenavn"
          required
        />

        <Input
          label="Lokasjon"
          id="location"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="F.eks. Nordsjøen"
        />

        <Textarea
          label="Beskrivelse"
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Kort beskrivelse av prosjektet"
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
          label="Tildelt til"
          id="assignedTo"
          name="assignedTo"
          value={form.assignedTo}
          onChange={handleChange}
          placeholder="Navn på ansvarlig"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Startdato"
            id="startDate"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
          />
          <Input
            label="Frist"
            id="dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Lagre endringer" : "Opprett prosjekt"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
