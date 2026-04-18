CREATE TABLE `drawings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rov_system_id` integer NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text DEFAULT 'pdf' NOT NULL,
	`version` text DEFAULT '1.0',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rov_system_id`) REFERENCES `rov_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_drawings_rov_system_id` ON `drawings` (`rov_system_id`);--> statement-breakpoint
CREATE TABLE `parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`description` text,
	`category` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 5 NOT NULL,
	`max_stock` integer DEFAULT 50 NOT NULL,
	`unit` text DEFAULT 'stk' NOT NULL,
	`unit_price` real DEFAULT 0,
	`supplier` text,
	`location` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parts_sku_unique` ON `parts` (`sku`);--> statement-breakpoint
CREATE TABLE `procedures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rov_system_id` integer,
	`category` text,
	`content` text,
	`version` text DEFAULT '1.0',
	`file_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rov_system_id`) REFERENCES `rov_systems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_procedures_rov_system_id` ON `procedures` (`rov_system_id`);--> statement-breakpoint
CREATE TABLE `project_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_data` text NOT NULL,
	`file_size` integer NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_attachments_project_id` ON `project_attachments` (`project_id`);--> statement-breakpoint
CREATE TABLE `project_parts_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`quantity_used` integer NOT NULL,
	`deducted_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_parts_usage_project_id` ON `project_parts_usage` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_parts_usage_part_id` ON `project_parts_usage` (`part_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`client` text NOT NULL,
	`location` text,
	`rov_system_id` integer,
	`status` text DEFAULT 'planning' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assigned_to` text,
	`start_date` text,
	`due_date` text,
	`completed_at` text,
	`notes` text,
	`has_tilbud` integer DEFAULT 0 NOT NULL,
	`has_po` integer DEFAULT 0 NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rov_system_id`) REFERENCES `rov_systems`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_projects_rov_system_id` ON `projects` (`rov_system_id`);--> statement-breakpoint
CREATE INDEX `idx_projects_status` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`part_id` integer NOT NULL,
	`quantity_ordered` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`triggered_by` text DEFAULT 'auto' NOT NULL,
	`supplier` text,
	`order_date` text DEFAULT (datetime('now')),
	`expected_delivery` text,
	`received_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_part_id` ON `purchase_orders` (`part_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_status` ON `purchase_orders` (`status`);--> statement-breakpoint
CREATE TABLE `rov_system_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rov_system_id` integer NOT NULL,
	`part_id` integer NOT NULL,
	`quantity_required` integer DEFAULT 1 NOT NULL,
	`notes` text,
	FOREIGN KEY (`rov_system_id`) REFERENCES `rov_systems`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rov_system_parts_unique` ON `rov_system_parts` (`rov_system_id`,`part_id`);--> statement-breakpoint
CREATE TABLE `rov_systems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`model` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`project_id` integer,
	`assigned_to` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_todos_project_id` ON `todos` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_todos_status` ON `todos` (`status`);--> statement-breakpoint
CREATE TABLE `workshop_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`message` text NOT NULL,
	`log_type` text DEFAULT 'progress' NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workshop_logs_project_id` ON `workshop_logs` (`project_id`);