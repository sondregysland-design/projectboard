export interface Project {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemId: number | null;
  rovSystemName?: string | null;
  rovSystemModel?: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAttachment {
  id: number;
  projectId: number;
  name: string;
  fileType: string;
  fileData: string;
  fileSize: number;
  category: "general" | "tilbud" | "po";
  createdAt: string;
}

export interface RovSystem {
  id: number;
  name: string;
  model: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RovSystemListItem extends RovSystem {
  bomCount: number;
}

export interface Procedure {
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

export interface Drawing {
  id: number;
  name: string;
  description: string | null;
  rovSystemId: number;
  fileUrl: string;
  fileType: string;
  version: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  quantity: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice: number | null;
  supplier: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BomPart {
  id: number;
  partId: number;
  quantityRequired: number;
  notes: string | null;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
  partQuantity: number | null;
  partMinStock?: number | null;
  partUnit: string | null;
}

export interface Todo {
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
  projectName?: string;
}

export interface WorkshopLog {
  id: number;
  projectId: number;
  message: string;
  logType: string;
  createdBy: string | null;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  partId: number;
  quantityOrdered: number;
  status: string;
  triggeredBy: string;
  supplier: string | null;
  orderDate: string | null;
  expectedDelivery: string | null;
  receivedAt: string | null;
  createdAt: string;
  partName?: string;
  partSku?: string;
}

export interface PartsUsage {
  id: number;
  projectId: number;
  partId: number;
  quantityUsed: number;
  deductedAt: string;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
}
