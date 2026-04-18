# Project Dashboard Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add expandable project rows with attachments/tilbud/PO/contact/notes, an archive page, and a proofreading page to the existing project-dashboard.

**Architecture:** Extend the existing Drizzle schema with new columns on `projects` and a new `projectAttachments` table. Add two new pages (Arkiv, Rettskriving) to the leader route group. Refactor ProjectTable to support expandable rows with inline editing.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM + Turso, OpenAI API, Tailwind CSS 4, Lucide icons.

**Important:** This is Next.js 16 — read `node_modules/next/dist/docs/` before writing any code if unsure about APIs.

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/components/projects/ProjectRowExpander.tsx` | Expandable detail panel for a project row (attachments, tilbud/PO, contact, notes, status) |
| `src/app/(leader)/arkiv/page.tsx` | Archive page showing completed projects |
| `src/app/(leader)/rettskriving/page.tsx` | Proofreading page with OpenAI integration |
| `src/app/api/projects/[id]/attachments/route.ts` | GET/POST attachments for a project |
| `src/app/api/projects/[id]/attachments/[attachmentId]/route.ts` | DELETE single attachment |
| `src/app/api/proofread/route.ts` | POST proofreading endpoint |

### Modified files
| File | Changes |
|------|---------|
| `src/lib/db/schema.ts` | Add `projectAttachments` table + new columns on `projects` |
| `src/lib/types.ts` | Add `ProjectAttachment` interface |
| `src/components/Sidebar.tsx` | Add Arkiv + Rettskriving nav items |
| `src/components/projects/ProjectTable.tsx` | Add expand/collapse button + render `ProjectRowExpander` |
| `src/app/api/projects/[id]/route.ts` | Handle new fields in PATCH, auto-set `completedAt` |
| `src/app/(leader)/prosjekter/page.tsx` | Filter out completed projects from active tab, pass `onProjectUpdate` callback |

---

## Task 1: Extend Database Schema

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add new columns to `projects` table in schema**

In `src/lib/db/schema.ts`, add these columns inside the `projects` table definition, after `updatedAt`:

```typescript
    notes: text("notes"),
    hasTilbud: integer("has_tilbud").notNull().default(0),
    hasPo: integer("has_po").notNull().default(0),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
```

- [ ] **Step 2: Add `projectAttachments` table to schema**

In `src/lib/db/schema.ts`, add after the `workshopLogs` table:

```typescript
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
```

- [ ] **Step 3: Add `ProjectAttachment` interface to types**

In `src/lib/types.ts`, add after the `PartsUsage` interface:

```typescript
export interface ProjectAttachment {
  id: number;
  projectId: number;
  name: string;
  fileType: string;
  fileData: string;
  fileSize: number;
  category: string;
  createdAt: string;
}
```

- [ ] **Step 4: Run drizzle-kit push to apply schema changes**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npx drizzle-kit push`
Expected: Schema changes applied to the database (new columns on projects, new project_attachments table).

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/lib/db/schema.ts src/lib/types.ts
git commit -m "feat: extend schema with project attachments, notes, contact, tilbud/po flags"
```

---

## Task 2: Update Project API to Handle New Fields

**Files:**
- Modify: `src/app/api/projects/[id]/route.ts`
- Modify: `src/app/api/projects/route.ts`

- [ ] **Step 1: Update PATCH to handle new fields and auto-set completedAt**

In `src/app/api/projects/[id]/route.ts`, replace the existing PATCH function body. Change the destructure line to include the new fields:

```typescript
    const body = await request.json();
    const { name, description, client, location, status, priority, assignedTo, startDate, dueDate, completedAt, notes, hasTilbud, hasPo, contactName, contactEmail } = body;
```

And update the `.set()` call to include:

```typescript
        ...(notes !== undefined && { notes }),
        ...(hasTilbud !== undefined && { hasTilbud: hasTilbud ? 1 : 0 }),
        ...(hasPo !== undefined && { hasPo: hasPo ? 1 : 0 }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
```

Also add auto-completedAt logic. After the destructure, before the db.update:

```typescript
    // Auto-set completedAt when status changes to completed
    let resolvedCompletedAt = completedAt;
    if (status === "completed" && completedAt === undefined) {
      resolvedCompletedAt = new Date().toISOString();
    }
```

And in `.set()`, change the completedAt line to:
```typescript
        ...(resolvedCompletedAt !== undefined && { completedAt: resolvedCompletedAt }),
```

- [ ] **Step 2: Update GET for project detail to include new fields**

In `src/app/api/projects/[id]/route.ts`, in the GET function's `.select()`, add the new columns after `updatedAt`:

```typescript
        notes: projects.notes,
        hasTilbud: projects.hasTilbud,
        hasPo: projects.hasPo,
        contactName: projects.contactName,
        contactEmail: projects.contactEmail,
```

- [ ] **Step 3: Update GET for project list to include new fields**

In `src/app/api/projects/route.ts`, in the GET function's `.select()`, add after `updatedAt`:

```typescript
        notes: projects.notes,
        hasTilbud: projects.hasTilbud,
        hasPo: projects.hasPo,
        contactName: projects.contactName,
        contactEmail: projects.contactEmail,
```

- [ ] **Step 4: Verify the dev server starts without errors**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/app/api/projects/route.ts src/app/api/projects/\[id\]/route.ts
git commit -m "feat: extend project API with notes, contact, tilbud/po fields and auto-completedAt"
```

---

## Task 3: Create Attachments API

**Files:**
- Create: `src/app/api/projects/[id]/attachments/route.ts`
- Create: `src/app/api/projects/[id]/attachments/[attachmentId]/route.ts`

- [ ] **Step 1: Create the attachments list/upload endpoint**

Create `src/app/api/projects/[id]/attachments/route.ts`:

```typescript
import { db } from "@/lib/db";
import { projectAttachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const result = await db
      .select({
        id: projectAttachments.id,
        projectId: projectAttachments.projectId,
        name: projectAttachments.name,
        fileType: projectAttachments.fileType,
        fileSize: projectAttachments.fileSize,
        category: projectAttachments.category,
        createdAt: projectAttachments.createdAt,
      })
      .from(projectAttachments)
      .where(eq(projectAttachments.projectId, projectId));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attachments");
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, fileType, fileData, fileSize, category } = body;

    if (!name || !fileType || !fileData || !fileSize) {
      return Response.json(
        { error: "name, fileType, fileData, and fileSize are required" },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(projectAttachments)
      .values({
        projectId,
        name,
        fileType,
        fileData,
        fileSize,
        category: category || "general",
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to upload attachment");
  }
}
```

- [ ] **Step 2: Create the attachment delete endpoint**

Create `src/app/api/projects/[id]/attachments/[attachmentId]/route.ts`:

```typescript
import { db } from "@/lib/db";
import { projectAttachments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await requireApiAuth();
    const { id, attachmentId } = await params;
    const projectId = parseInt(id, 10);
    const attId = parseInt(attachmentId, 10);

    if (isNaN(projectId) || isNaN(attId)) {
      return Response.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const result = await db
      .delete(projectAttachments)
      .where(
        and(
          eq(projectAttachments.id, attId),
          eq(projectAttachments.projectId, projectId)
        )
      )
      .returning();

    if (result.length === 0) {
      return Response.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Attachment deleted" });
  } catch (error) {
    return handleApiError(error, "Failed to delete attachment");
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/app/api/projects/\[id\]/attachments/
git commit -m "feat: add attachments API endpoints (list, upload, delete)"
```

---

## Task 4: Create ProjectRowExpander Component

**Files:**
- Create: `src/components/projects/ProjectRowExpander.tsx`

- [ ] **Step 1: Create the expandable detail panel component**

Create `src/components/projects/ProjectRowExpander.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Loader2,
  Check,
} from "lucide-react";

interface Attachment {
  id: number;
  name: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

interface ProjectExpandData {
  id: number;
  status: string;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
}

interface ProjectRowExpanderProps {
  project: ProjectExpandData;
  onProjectUpdate: () => void;
}

const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function ProjectRowExpander({
  project,
  onProjectUpdate,
}: ProjectRowExpanderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(project.notes || "");
  const [contactName, setContactName] = useState(project.contactName || "");
  const [contactEmail, setContactEmail] = useState(project.contactEmail || "");
  const [hasTilbud, setHasTilbud] = useState(!!project.hasTilbud);
  const [hasPo, setHasPo] = useState(!!project.hasPo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (err) {
      console.error("Kunne ikke hente vedlegg:", err);
    } finally {
      setLoadingAttachments(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  async function patchProject(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onProjectUpdate();
      }
    } catch (err) {
      console.error("Kunne ikke oppdatere prosjekt:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    category: "general" | "tilbud" | "po"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Filen er for stor. Maks 5MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`/api/projects/${project.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            fileType: file.type || "application/octet-stream",
            fileData: base64,
            fileSize: file.size,
            category,
          }),
        });
        if (res.ok) {
          await fetchAttachments();
          if (category === "tilbud") {
            setHasTilbud(true);
            await patchProject({ hasTilbud: true });
          } else if (category === "po") {
            setHasPo(true);
            await patchProject({ hasPo: true });
          }
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Filopplasting feilet:", err);
      setUploading(false);
    }
    e.target.value = "";
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      const res = await fetch(
        `/api/projects/${project.id}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchAttachments();
      }
    } catch (err) {
      console.error("Kunne ikke slette vedlegg:", err);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  const generalAttachments = attachments.filter(
    (a) => a.category === "general"
  );
  const tilbudAttachments = attachments.filter((a) => a.category === "tilbud");
  const poAttachments = attachments.filter((a) => a.category === "po");

  return (
    <div className="px-4 sm:px-6 py-4 bg-warm-sand/20 border-t border-border-cream space-y-5">
      {/* Row 1: Status + Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status change */}
        <div>
          <Select
            label="Status"
            id={`status-${project.id}`}
            name="status"
            value={project.status}
            onChange={(e) => patchProject({ status: e.target.value })}
            options={statusOptions}
          />
        </div>

        {/* Customer contact */}
        <div>
          <Input
            label="Kontaktperson"
            id={`contact-name-${project.id}`}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            onBlur={() => patchProject({ contactName })}
            placeholder="Navn"
          />
        </div>
        <div>
          <Input
            label="E-post"
            id={`contact-email-${project.id}`}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            onBlur={() => patchProject({ contactEmail })}
            placeholder="epost@kunde.no"
          />
        </div>
      </div>

      {/* Row 2: Tilbud + PO checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={hasTilbud}
              onChange={(e) => {
                setHasTilbud(e.target.checked);
                patchProject({ hasTilbud: e.target.checked });
              }}
              className="rounded border-border-warm text-terracotta focus:ring-terracotta"
            />
            Tilbud mottatt
          </label>
          {hasTilbud && (
            <div className="ml-6 space-y-1">
              {tilbudAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 text-sm text-charcoal"
                >
                  <FileText className="h-3.5 w-3.5 text-stone" />
                  <span className="truncate">{att.name}</span>
                  <span className="text-xs text-stone">
                    ({formatFileSize(att.fileSize)})
                  </span>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="ml-auto p-1 text-stone hover:text-error transition-colors"
                    title="Slett"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="inline-flex items-center gap-1.5 text-xs text-terracotta cursor-pointer hover:text-terracotta/80">
                <Upload className="h-3.5 w-3.5" />
                Last opp tilbud-PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "tilbud")}
                />
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={hasPo}
              onChange={(e) => {
                setHasPo(e.target.checked);
                patchProject({ hasPo: e.target.checked });
              }}
              className="rounded border-border-warm text-terracotta focus:ring-terracotta"
            />
            PO mottatt
          </label>
          {hasPo && (
            <div className="ml-6 space-y-1">
              {poAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 text-sm text-charcoal"
                >
                  <FileText className="h-3.5 w-3.5 text-stone" />
                  <span className="truncate">{att.name}</span>
                  <span className="text-xs text-stone">
                    ({formatFileSize(att.fileSize)})
                  </span>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="ml-auto p-1 text-stone hover:text-error transition-colors"
                    title="Slett"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="inline-flex items-center gap-1.5 text-xs text-terracotta cursor-pointer hover:text-terracotta/80">
                <Upload className="h-3.5 w-3.5" />
                Last opp PO-PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "po")}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: General attachments */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-stone" />
          <span className="text-sm font-medium text-charcoal">Vedlegg</span>
        </div>
        {loadingAttachments ? (
          <div className="flex items-center gap-2 text-xs text-stone">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Laster...
          </div>
        ) : (
          <div className="space-y-1">
            {generalAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 text-sm text-charcoal"
              >
                <FileText className="h-3.5 w-3.5 text-stone" />
                <span className="truncate">{att.name}</span>
                <span className="text-xs text-stone">
                  ({formatFileSize(att.fileSize)})
                </span>
                <button
                  onClick={() => handleDeleteAttachment(att.id)}
                  className="ml-auto p-1 text-stone hover:text-error transition-colors"
                  title="Slett"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="inline-flex items-center gap-1.5 text-xs text-terracotta cursor-pointer hover:text-terracotta/80">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Laster opp..." : "Last opp fil"}
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "general")}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Row 4: Notes */}
      <div>
        <Textarea
          label="Notater"
          id={`notes-${project.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => patchProject({ notes })}
          placeholder="Interne notater om prosjektet..."
          rows={3}
        />
      </div>

      {/* Save indicator */}
      {(saving || saved) && (
        <div className="flex items-center gap-1.5 text-xs text-stone">
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-success" />
          )}
          {saving ? "Lagrer..." : "Lagret"}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/components/projects/ProjectRowExpander.tsx
git commit -m "feat: add ProjectRowExpander component with attachments, tilbud/po, contact, notes"
```

---

## Task 5: Update ProjectTable with Expand/Collapse

**Files:**
- Modify: `src/components/projects/ProjectTable.tsx`

- [ ] **Step 1: Rewrite ProjectTable to support expandable rows**

Replace the entire content of `src/components/projects/ProjectTable.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectRowExpander } from "./ProjectRowExpander";
import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { FolderKanban, ChevronDown, ChevronRight } from "lucide-react";

interface Project {
  id: number;
  name: string;
  client: string;
  location: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  rovSystemName: string | null;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
}

interface ProjectTableProps {
  projects: Project[];
  onProjectUpdate?: () => void;
}

export function ProjectTable({ projects, onProjectUpdate }: ProjectTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <FolderKanban className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen prosjekter funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett et nytt prosjekt for å komme i gang.
        </p>
      </div>
    );
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function toggleExpand(e: React.MouseEvent, projectId: number) {
    e.stopPropagation();
    setExpandedId((prev) => (prev === projectId ? null : projectId));
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {projects.map((project) => (
          <div key={project.id}>
            <div
              className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => toggleExpand(e, project.id)}
                    className="p-0.5 text-stone hover:text-near-black shrink-0"
                  >
                    {expandedId === project.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0" onClick={() => router.push(`/prosjekter/${project.id}`)}>
                    <p className="font-medium text-near-black truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-charcoal mt-0.5">
                      {project.client}
                    </p>
                  </div>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>
              {project.rovSystemName && (
                <p className="text-xs text-stone mb-2 ml-7">
                  ROV: {project.rovSystemName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap ml-7">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    PRIORITY_COLORS[project.priority] || ""
                  }`}
                >
                  {PRIORITY_LABELS[project.priority] || project.priority}
                </span>
                {project.dueDate && (
                  <span className="text-xs text-stone">
                    Frist: {formatDate(project.dueDate)}
                  </span>
                )}
              </div>
            </div>
            {expandedId === project.id && (
              <div className="border border-t-0 border-border-cream rounded-b-lg">
                <ProjectRowExpander
                  project={project}
                  onProjectUpdate={onProjectUpdate || (() => {})}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-cream text-left">
              <th className="pb-3 pt-1 w-8"></th>
              <th className="pb-3 pt-1 font-medium text-stone">Prosjekt</th>
              <th className="pb-3 pt-1 font-medium text-stone">Klient</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                ROV System
              </th>
              <th className="pb-3 pt-1 font-medium text-stone">Status</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden sm:table-cell">
                Prioritet
              </th>
              <th className="pb-3 pt-1 font-medium text-stone hidden lg:table-cell">
                Frist
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <>
                <tr
                  key={project.id}
                  className={`border-b border-border-cream cursor-pointer hover:bg-warm-sand/30 transition-colors ${
                    expandedId === project.id ? "bg-warm-sand/20" : ""
                  }`}
                >
                  <td className="py-3 pl-2">
                    <button
                      onClick={(e) => toggleExpand(e, project.id)}
                      className="p-1 text-stone hover:text-near-black rounded transition-colors"
                    >
                      {expandedId === project.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td
                    className="py-3 pr-4"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    <span className="font-medium text-near-black">
                      {project.name}
                    </span>
                    {project.location && (
                      <span className="block text-xs text-stone mt-0.5">
                        {project.location}
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3 pr-4 text-charcoal"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {project.client}
                  </td>
                  <td
                    className="py-3 pr-4 text-charcoal hidden md:table-cell"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {project.rovSystemName || (
                      <span className="text-stone italic">Ikke tildelt</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        PRIORITY_COLORS[project.priority] || ""
                      }`}
                    >
                      {PRIORITY_LABELS[project.priority] || project.priority}
                    </span>
                  </td>
                  <td
                    className="py-3 text-charcoal hidden lg:table-cell"
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                  >
                    {formatDate(project.dueDate)}
                  </td>
                </tr>
                {expandedId === project.id && (
                  <tr key={`expand-${project.id}`}>
                    <td colSpan={7} className="p-0">
                      <ProjectRowExpander
                        project={project}
                        onProjectUpdate={onProjectUpdate || (() => {})}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update ProjectsPage to pass onProjectUpdate**

In `src/app/(leader)/prosjekter/page.tsx`, change the `<ProjectTable>` usage to pass the callback:

Replace:
```typescript
            <ProjectTable projects={filteredProjects} />
```

With:
```typescript
            <ProjectTable projects={filteredProjects} onProjectUpdate={fetchProjects} />
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/components/projects/ProjectTable.tsx src/app/\(leader\)/prosjekter/page.tsx
git commit -m "feat: add expandable project rows with detail panel"
```

---

## Task 6: Create Archive Page

**Files:**
- Create: `src/app/(leader)/arkiv/page.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create the archive page**

Create `src/app/(leader)/arkiv/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { Archive, Loader2, FolderKanban } from "lucide-react";

interface ArchivedProject {
  id: number;
  name: string;
  client: string;
  location: string | null;
  status: string;
  completedAt: string | null;
}

export default function ArchivePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setProjects(data.filter((p: ArchivedProject) => p.status === "completed"));
    } catch (err) {
      console.error("Kunne ikke hente arkiverte prosjekter:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Arkiv
        </h1>
        <p className="text-sm text-stone mt-1">
          Fullførte prosjekter
        </p>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster arkiv...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-warm-sand p-4 mb-4">
                <Archive className="h-8 w-8 text-stone" />
              </div>
              <p className="text-lg font-medium text-charcoal">
                Ingen arkiverte prosjekter
              </p>
              <p className="text-sm text-stone mt-1">
                Prosjekter som markeres som fullført vil vises her.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="sm:hidden space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/prosjekter/${project.id}`)}
                    className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-medium text-near-black truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-charcoal mt-0.5">
                          {project.client}
                        </p>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.completedAt && (
                      <p className="text-xs text-stone">
                        Fullført: {formatDate(project.completedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-cream text-left">
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Prosjekt
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Klient
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                        Lokasjon
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Fullført
                      </th>
                      <th className="pb-3 pt-1 font-medium text-stone">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => router.push(`/prosjekter/${project.id}`)}
                        className="border-b border-border-cream last:border-b-0 cursor-pointer hover:bg-warm-sand/30 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <span className="font-medium text-near-black">
                            {project.name}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-charcoal">
                          {project.client}
                        </td>
                        <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                          {project.location || "—"}
                        </td>
                        <td className="py-3 pr-4 text-charcoal">
                          {formatDate(project.completedAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <ProjectStatusBadge status={project.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Add Arkiv and Rettskriving to Sidebar**

In `src/components/Sidebar.tsx`, update the imports to add the new icons:

```typescript
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Package,
  Wrench,
  Menu,
  X,
  LogOut,
  Anchor,
  Archive,
  SpellCheck,
} from "lucide-react";
```

Then add the two new nav items to the `leaderNav` array, after the Lager entry:

```typescript
  { href: "/arkiv", label: "Arkiv", icon: Archive },
  { href: "/rettskriving", label: "Rettskriving", icon: SpellCheck },
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/app/\(leader\)/arkiv/page.tsx src/components/Sidebar.tsx
git commit -m "feat: add archive page and sidebar nav items for arkiv + rettskriving"
```

---

## Task 7: Create Proofreading Page and API

**Files:**
- Create: `src/app/api/proofread/route.ts`
- Create: `src/app/(leader)/rettskriving/page.tsx`

- [ ] **Step 1: Create the proofreading API endpoint**

Create `src/app/api/proofread/route.ts`:

```typescript
import { getOpenAI } from "@/lib/openai";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return Response.json(
        { error: "Text exceeds maximum length of 10000 characters" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `Du er en korrekturleser. Korriger rettskriving og grammatikk i teksten under.

Regler:
- Behold samme språk som input (norsk inn → norsk ut, engelsk inn → engelsk ut)
- Bruk enkle, naturlige ord. Ikke bytt ut vanlige ord med vanskelige synonymer.
- Ikke endre mening eller tone
- Ikke legg til eller fjern innhold
- Teksten skal lese naturlig, som om et menneske skrev den
- Returner KUN den korrigerte teksten, ingen forklaringer`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const corrected = completion.choices[0]?.message?.content || text;

    return Response.json({ corrected });
  } catch (error) {
    return handleApiError(error, "Failed to proofread text");
  }
}
```

- [ ] **Step 2: Create the proofreading page**

Create `src/app/(leader)/rettskriving/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Copy, Check, SpellCheck } from "lucide-react";

export default function ProofreadingPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProofread() {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setOutputText("");

    try {
      const res = await fetch("/api/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Noe gikk galt");
      }

      const data = await res.json();
      setOutputText(data.corrected);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunne ikke korrekturlese teksten"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = outputText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-near-black">
          Rettskriving
        </h1>
        <p className="text-sm text-stone mt-1">
          Lim inn tekst for korrekturlesing. Språket oppdages automatisk.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Input */}
          <Textarea
            label="Tekst å korrekturlese"
            id="proofread-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Lim inn teksten du ønsker å korrekturlese her..."
            rows={8}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleProofread}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SpellCheck className="h-4 w-4" />
              )}
              {loading ? "Korrigerer..." : "Rett tekst"}
            </Button>
            {inputText.length > 0 && (
              <span className="text-xs text-stone">
                {inputText.length} / 10 000 tegn
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Output */}
          {outputText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-charcoal">
                  Korrigert tekst
                </label>
                <Button variant="ghost" onClick={handleCopy} className="text-xs">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Kopiert!" : "Kopier"}
                </Button>
              </div>
              <div className="w-full px-3 py-3 bg-ivory border border-border-warm rounded-lg text-near-black text-sm whitespace-pre-wrap leading-relaxed">
                {outputText}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/app/api/proofread/route.ts src/app/\(leader\)/rettskriving/page.tsx
git commit -m "feat: add proofreading page with OpenAI integration"
```

---

## Task 8: Update Projects Page to Filter Out Completed

**Files:**
- Modify: `src/app/(leader)/prosjekter/page.tsx`

- [ ] **Step 1: Remove completed tab from projects page**

In `src/app/(leader)/prosjekter/page.tsx`, the page currently shows Active/Fullførte/Standby tabs. Since completed projects now live in the Archive page, remove the "completed" tab.

Change the `TabId` type:
```typescript
type TabId = "active" | "standby";
```

Remove `completedProjects`:
```typescript
  const activeProjects = projects.filter((p) =>
    ACTIVE_STATUSES.includes(p.status)
  );
  const standbyProjects = projects.filter((p) => p.status === "standby");

  const filteredProjects =
    activeTab === "active" ? activeProjects : standbyProjects;

  const tabs = [
    { id: "active", label: "Aktive", count: activeProjects.length },
    { id: "standby", label: "Standby", count: standbyProjects.length },
  ];
```

- [ ] **Step 2: Update the Project interface in the page to include new fields**

Update the `Project` interface in the same file to include the new fields that ProjectTable needs:

```typescript
interface Project {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemId: number | null;
  rovSystemName: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
}
```

- [ ] **Step 3: Verify build**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add src/app/\(leader\)/prosjekter/page.tsx
git commit -m "feat: remove completed tab from projects page (moved to archive)"
```

---

## Task 9: Final Integration Verification

- [ ] **Step 1: Start dev server and verify all pages load**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run dev`

Verify by navigating to:
- `/prosjekter` — project list loads, expand chevron visible on each row
- Click chevron — detail panel opens with status, contact, tilbud/po, notes, attachments
- `/arkiv` — archive page loads (may be empty if no completed projects)
- `/rettskriving` — proofreading page loads with textarea and button
- Sidebar shows all nav items including Arkiv and Rettskriving

- [ ] **Step 2: Test project expand functionality**

- Click expand on a project row
- Change status via dropdown — verify it saves
- Enter contact name/email, blur — verify it saves
- Check/uncheck tilbud/PO checkboxes
- Upload a file attachment
- Type notes and blur — verify it saves

- [ ] **Step 3: Test proofreading**

- Navigate to `/rettskriving`
- Paste Norwegian text with typos — verify it returns corrected text
- Paste English text — verify it returns English
- Click "Kopier" — verify clipboard copy works

- [ ] **Step 4: Run build to verify no errors**

Run: `cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
cd c:/Users/sondr/Testing_av_nytt_oppsett/project-dashboard
git add -A
git commit -m "fix: integration fixes from final testing"
```
