"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export interface RovSystemFormData {
  name: string;
  model: string;
  description: string;
}

interface RovSystemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RovSystemFormData) => void;
  initialData?: Partial<RovSystemFormData>;
}

const defaultForm: RovSystemFormData = {
  name: "",
  model: "",
  description: "",
};

export function RovSystemForm({
  open,
  onClose,
  onSubmit,
  initialData,
}: RovSystemFormProps) {
  const [form, setForm] = useState<RovSystemFormData>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...initialData });
    }
  }, [open, initialData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.model.trim()) return;
    onSubmit(form);
  }

  const isEditing = !!initialData;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Rediger ROV-system" : "Nytt ROV-system"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Systemnavn *"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="F.eks. Kystdesign Supporter"
          required
        />

        <Input
          label="Modell *"
          id="model"
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="F.eks. Supporter MK2"
          required
        />

        <Textarea
          label="Beskrivelse"
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Kort beskrivelse av systemet"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Lagre endringer" : "Opprett system"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
