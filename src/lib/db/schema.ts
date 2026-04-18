import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const rovSystems = sqliteTable("rov_systems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  model: text("model").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "maintenance", "retired"] })
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    client: text("client").notNull(),
    location: text("location"),
    rovSystemId: integer("rov_system_id").references(() => rovSystems.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: [
        "planning",
        "workshop",
        "offshore",
        "invoicing",
        "completed",
        "standby",
      ],
    })
      .notNull()
      .default("planning"),
    priority: text("priority", {
      enum: ["low", "medium", "high", "critical"],
    })
      .notNull()
      .default("medium"),
    assignedTo: text("assigned_to"),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    completedAt: text("completed_at"),
    notes: text("notes"),
    hasTilbud: integer("has_tilbud").notNull().default(0),
    hasPo: integer("has_po").notNull().default(0),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_projects_rov_system_id").on(table.rovSystemId),
    index("idx_projects_status").on(table.status),
  ]
);

export const projectAttachments = sqliteTable(
  "project_attachments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fileType: text("file_type").notNull(),
    fileData: text("file_data").notNull(),
    fileSize: integer("file_size").notNull(),
    category: text("category", {
      enum: ["general", "tilbud", "po"],
    })
      .notNull()
      .default("general"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_project_attachments_project_id").on(table.projectId),
  ]
);

export const procedures = sqliteTable(
  "procedures",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    rovSystemId: integer("rov_system_id").references(() => rovSystems.id, {
      onDelete: "cascade",
    }),
    category: text("category"),
    content: text("content"),
    version: text("version").default("1.0"),
    fileUrl: text("file_url"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idx_procedures_rov_system_id").on(table.rovSystemId)]
);

export const drawings = sqliteTable(
  "drawings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    rovSystemId: integer("rov_system_id")
      .notNull()
      .references(() => rovSystems.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type", { enum: ["pdf", "dwg", "png"] })
      .notNull()
      .default("pdf"),
    version: text("version").default("1.0"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idx_drawings_rov_system_id").on(table.rovSystemId)]
);

export const parts = sqliteTable("parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  maxStock: integer("max_stock").notNull().default(50),
  unit: text("unit", { enum: ["stk", "meter", "kg", "liter"] })
    .notNull()
    .default("stk"),
  unitPrice: real("unit_price").default(0),
  supplier: text("supplier"),
  location: text("location"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rovSystemParts = sqliteTable(
  "rov_system_parts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rovSystemId: integer("rov_system_id")
      .notNull()
      .references(() => rovSystems.id, { onDelete: "cascade" }),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    quantityRequired: integer("quantity_required").notNull().default(1),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("idx_rov_system_parts_unique").on(
      table.rovSystemId,
      table.partId
    ),
  ]
);

export const projectPartsUsage = sqliteTable(
  "project_parts_usage",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    quantityUsed: integer("quantity_used").notNull(),
    deductedAt: text("deducted_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_project_parts_usage_project_id").on(table.projectId),
    index("idx_project_parts_usage_part_id").on(table.partId),
  ]
);

export const purchaseOrders = sqliteTable(
  "purchase_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    partId: integer("part_id")
      .notNull()
      .references(() => parts.id),
    quantityOrdered: integer("quantity_ordered").notNull(),
    status: text("status", {
      enum: ["pending", "ordered", "received", "cancelled"],
    })
      .notNull()
      .default("pending"),
    triggeredBy: text("triggered_by", { enum: ["auto", "manual"] })
      .notNull()
      .default("auto"),
    supplier: text("supplier"),
    orderDate: text("order_date").default(sql`(datetime('now'))`),
    expectedDelivery: text("expected_delivery"),
    receivedAt: text("received_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_purchase_orders_part_id").on(table.partId),
    index("idx_purchase_orders_status").on(table.status),
  ]
);

export const todos = sqliteTable(
  "todos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    assignedTo: text("assigned_to"),
    priority: text("priority", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("medium"),
    status: text("status", {
      enum: ["pending", "in_progress", "completed"],
    })
      .notNull()
      .default("pending"),
    dueDate: text("due_date"),
    completedAt: text("completed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    index("idx_todos_project_id").on(table.projectId),
    index("idx_todos_status").on(table.status),
  ]
);

export const workshopLogs = sqliteTable(
  "workshop_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    logType: text("log_type", {
      enum: ["started", "progress", "completed", "issue"],
    })
      .notNull()
      .default("progress"),
    createdBy: text("created_by"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idx_workshop_logs_project_id").on(table.projectId)]
);
