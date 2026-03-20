export interface ProjectLink {
  utstyr: string;
  date: string;
  returnDate: string;
  kabalUrl: string;
  modemUrl: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  date: string;
  field: string;
  felt: string[];
  links: ProjectLink[];
  ecompletionUrl: string;
  bsaUrl: string;
  so: string;
  ce: boolean;
  po: boolean;
  notes: string;
  contactName: string;
  contactInfo: string;
  shippingAddress: string;
  files: ProjectFile[];
  isStandin: boolean;
}

export interface Todo {
  id: string;
  task: string;
  category: string;
  status: string;
  dueDate: string;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  url: string;
  storagePath: string;
  size: number;
  uploadedAt: string;
}

export interface InvoiceData {
  id: string;
  projectId: string;
  fraktbrevPath: string | null;
  mottaksbrevPath: string | null;
  kabalPath: string | null;
  fraktbrevDate: string | null;
  mottaksbrevDate: string | null;
}

export type ProjectStatus =
  | "planning"
  | "workshop"
  | "offshore"
  | "invoicing"
  | "finished";

export type ProjectTab = "active" | "completed" | "standin";

export interface Customer {
  id: string;
  name: string;
}

export interface Equipment {
  id: string;
  name: string;
  standardPrice: number;
  priceType: "daily" | "fixed";
}

export interface ContractPrice {
  id: string;
  customerId: string;
  equipmentId: string;
  price: number;
  priceType: "daily" | "fixed";
}
