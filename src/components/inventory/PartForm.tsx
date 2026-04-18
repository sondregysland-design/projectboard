"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export interface PartFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  location: string;
}

interface PartFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PartFormData) => Promise<void>;
  initialData?: Partial<PartFormData>;
}

const categoryOptions = [
  { value: "Hydraulikk", label: "Hydraulikk" },
  { value: "Elektronikk", label: "Elektronikk" },
  { value: "Mekanisk", label: "Mekanisk" },
  { value: "Kabel", label: "Kabel" },
  { value: "Optikk", label: "Optikk" },
  { value: "Annet", label: "Annet" },
];

const unitOptions = [
  { value: "stk", label: "stk" },
  { value: "meter", label: "meter" },
  { value: "kg", label: "kg" },
  { value: "liter", label: "liter" },
];

const emptyForm: PartFormData = {
  name: "",
  sku: "",
  description: "",
  category: "",
  quantity: 0,
  minStock: 5,
  maxStock: 50,
  unit: "stk",
  unitPrice: 0,
  supplier: "",
  location: "",
};

export function PartForm({
  open,
  onClose,
  onSubmit,
  initialData,
}: PartFormProps) {
  const [form, setForm] = useState<PartFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...initialData });
    }
  }, [open, initialData]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = !!initialData?.sku;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Rediger del" : "Legg til del"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Navn"
            id="part-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            label="SKU"
            id="part-sku"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            required
          />
        </div>

        <Textarea
          label="Beskrivelse"
          id="part-description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Kategori"
            id="part-category"
            name="category"
            value={form.category}
            onChange={handleChange}
            options={categoryOptions}
          />
          <Select
            label="Enhet"
            id="part-unit"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            options={unitOptions}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Antall"
            id="part-quantity"
            name="quantity"
            type="number"
            min={0}
            value={form.quantity}
            onChange={handleChange}
          />
          <Input
            label="Min. beholdning"
            id="part-minStock"
            name="minStock"
            type="number"
            min={0}
            value={form.minStock}
            onChange={handleChange}
          />
          <Input
            label="Maks. beholdning"
            id="part-maxStock"
            name="maxStock"
            type="number"
            min={0}
            value={form.maxStock}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Enhetspris (NOK)"
            id="part-unitPrice"
            name="unitPrice"
            type="number"
            min={0}
            step={0.01}
            value={form.unitPrice}
            onChange={handleChange}
          />
          <Input
            label="Leverand&oslash;r"
            id="part-supplier"
            name="supplier"
            value={form.supplier}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Lagerlokasjon"
          id="part-location"
          name="location"
          value={form.location}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Lagre endringer" : "Legg til del"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
